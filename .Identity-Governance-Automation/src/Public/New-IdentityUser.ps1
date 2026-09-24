function New-IdentityUser {
    
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [object]$IdentityData
    )

    Process {
        # 1. Ingest Data (Handle either file path string or parsed object)
        if ($IdentityData -is [string]) {
            if (-not (Test-Path -Path $IdentityData)) {
                throw "Configuration file not found at path: $IdentityData"
            }
            Write-Verbose "Reading user configuration data from JSON file..."
            $UserData = Get-Content -Raw -Path $IdentityData | ConvertFrom-Json
        } else {
            $UserData = $IdentityData
        }

        # 2. Enforce Strict Data Ingestion Validation
        $RequiredFields = @('FirstName', 'LastName', 'Department', 'JobTitle', 'Manager', 'EmploymentTier')
        foreach ($Field in $RequiredFields) {
            if ([string]::IsNullOrWhiteSpace($UserData.$Field)) {
                Write-Error "Data Ingestion Failed: Missing mandatory identity attribute '$Field'."
                return
            }
        }

        Write-Host "[INIT] Processing onboarding payload for $($UserData.FirstName) $($UserData.LastName)..." -ForegroundColor Cyan

        # 3. Generate Compliant Enterprise Username (e.g., jdoe)
        $BaseUsername = "$($UserData.FirstName.Substring(0,1).ToLower())$($UserData.LastName.ToLower())"
        $Username = $BaseUsername
        $Counter = 1

        # Check for username collisions in local Active Directory
        while (Get-ADUser -Filter "sAMAccountName -eq '$Username'") {
            Write-Warning "Username collision detected for '$Username'. Appending modifier..."
            $Username = "$BaseUsername$Counter"
            $Counter++
        }
        Write-Verbose "Generated compliant unique username: $Username"

        # 4. Determine Target Organizational Unit (OU) Path dynamically
        # Fallback to standard Users container if custom OU strategy isn't matched
        $TargetOU = "OU=$($UserData.Department),OU=Staff,DC=corp,DC=local"
        if (-not (Get-ADOrganizationalUnit -Identity $TargetOU -ErrorAction SilentlyContinue)) {
            Write-Warning "Target department OU not found. Routing to default Users container."
            $TargetOU = "CN=Users,DC=corp,DC=local"
        }

        # 5. Build Cryptographically Secure Governance Password
        # Generates a random 16-character string satisfying standard complexity requirements
        $PasswordLength = 16
        $Assembly = [System.Reflection.Assembly]::LoadWithPartialName("System.Web")
        $RawPassword = [System.Web.Security.Membership]::GeneratePassword($PasswordLength, 3)
        $SecurePassword = ConvertTo-SecureString $RawPassword -AsPlainText -Force

        # 6. Account Provisioning Orchestration with Structured Try/Catch
        try {
            $UserParams = @{
                Name                  = "$($UserData.FirstName) $($UserData.LastName)"
                GivenName             = $UserData.FirstName
                Surname               = $UserData.LastName
                SamAccountName        = $Username
                UserPrincipalName     = "$Username@corp.local"
                Title                 = $UserData.JobTitle
                Department            = $UserData.Department
                AccountPassword       = $SecurePassword
                ChangePasswordAtLogon = $true
                Enabled               = $true
                Path                  = $TargetOU
                PassThru              = $true
            }

            Write-Host "[AD-PROVISION] Executing Active Directory object creation for $Username..." -ForegroundColor Yellow
            $NewADUser = New-ADUser @UserParams

            # Assign Manager if manager identity exists
            $ManagerUser = Get-ADUser -Filter "Name -eq '$($UserData.Manager)'" -ErrorAction SilentlyContinue
            if ($ManagerUser) {
                Set-ADUser -Identity $NewADUser -Manager $ManagerUser
            }

            Write-Host "[SUCCESS] Local AD account provisioned successfully for $Username." -ForegroundColor Green

            # 7. Pass pipeline metadata forward for the next Phase (Cloud Sync & Exchange)
            return [PSCustomObject]@{
                SamAccountName = $Username
                UPN            = "$Username@corp.local"
                EmploymentTier = $UserData.EmploymentTier
                Status         = "LocalProvisioned"
            }
        }
        catch {
            Write-Error "Critical Provisioning Failure on user $Username: $_"
            # Here you would typically pipe this out to your automated log engine
        }
    }
}