'use client'

import { useState } from 'react'
import { LogOut, User, Settings, Power } from 'lucide-react'
import { signOut, signOutAllDevices } from '@/lib/auth/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface UserMenuProps {
  user: {
    email: string
    name?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const { toast } = useToast()
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to logout',
      })
    }
  }

  const handleLogoutAllDevices = async () => {
    setIsLoading(true)
    try {
      const { error } = await signOutAllDevices()
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to logout from all devices',
      })
    } finally {
      setIsLoading(false)
      setShowLogoutAllModal(false)
    }
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full"
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-sm font-medium">{initials}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowLogoutAllModal(true)}>
            <Power className="mr-2 h-4 w-4" />
            <span>Logout all devices</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout All Devices Confirmation Modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Logout from all devices?</CardTitle>
              <CardDescription>
                This will end your sessions on all devices. You&apos;ll need to log in
                again everywhere.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLogoutAllModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogoutAllDevices}
                disabled={isLoading}
              >
                {isLoading ? 'Logging out...' : 'Logout all devices'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}
