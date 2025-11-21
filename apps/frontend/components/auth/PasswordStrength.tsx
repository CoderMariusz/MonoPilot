'use client'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pwd: string): {
    level: 'weak' | 'medium' | 'strong'
    score: number
  } => {
    let score = 0

    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { level: 'weak', score: 33 }
    if (score <= 4) return { level: 'medium', score: 66 }
    return { level: 'strong', score: 100 }
  }

  const { level, score } = getStrength(password)

  const colorClasses = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const textClasses = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
  }

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${textClasses[level]}`}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[level]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="font-medium">Requirements:</p>
        <ul className="space-y-0.5 pl-4">
          <li className={password.length >= 8 ? 'text-green-600' : ''}>
            ✓ At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
            ✓ One uppercase letter
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
            ✓ One number
          </li>
        </ul>
      </div>
    </div>
  )
}
