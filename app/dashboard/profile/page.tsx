"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { ArrowLeft, Lock, Bell, Save, Loader2, Upload, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [marketing, setMarketing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PREDEFINED_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  ]

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setSelectedAvatar(user.image || null)
    }
  }, [user])

  const userInitials = user
    ? user.name
      ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      : user.username
        ? user.username.slice(0, 2).toUpperCase()
        : user.email.slice(0, 2).toUpperCase()
    : "U"

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG or GIF)",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        try {
          await authApi.updateProfile({ image: base64String })
          setSelectedAvatar(base64String)
          await refreshUser()
          toast({
            title: "Avatar updated",
            description: "Your profile picture has been updated successfully.",
          })
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to update avatar",
            variant: "destructive",
          })
        } finally {
          setIsUploadingAvatar(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      })
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await authApi.updateProfile({ 
        name,
        image: selectedAvatar || undefined
      })
      
      // Update local state immediately
      await refreshUser()
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectPredefinedAvatar = (url: string) => {
    setSelectedAvatar(url)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      })
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const hasProfileChanges = user && (
     name !== (user.name || "") || 
     selectedAvatar !== (user.image || null)
   )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Tabs defaultValue="profile" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <Label>Profile Picture</Label>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                          <AvatarImage
                            src={selectedAvatar || (user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : undefined)}
                            alt={user?.username || "User"}
                          />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border hover:bg-accent hover:text-accent-foreground"
                              onClick={handleAvatarClick}
                              disabled={isUploadingAvatar}
                            >
                              {isUploadingAvatar ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Custom
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF. Max size 2MB. Or choose from the gallery below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Avatar Gallery</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                          {PREDEFINED_AVATARS.map((avatarUrl, index) => (
                            <button
                              key={index}
                              onClick={() => handleSelectPredefinedAvatar(avatarUrl)}
                              className={`relative group rounded-full overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                                selectedAvatar === avatarUrl 
                                  ? "border-primary ring-2 ring-primary/20 ring-offset-1" 
                                  : "border-transparent hover:border-primary/50"
                              }`}
                            >
                              <img 
                                src={avatarUrl} 
                                alt={`Avatar option ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              {selectedAvatar === avatarUrl && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-border"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="border-border bg-muted/50 cursor-not-allowed"
                        placeholder="Enter your email"
                      />
                      <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={!hasProfileChanges || isSaving}
                    variant="gradient"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    {user?.hasPassword 
                      ? "Update your password to keep your account secure" 
                      : "Manage your account security and authentication methods"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user?.hasPassword ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="border-border"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border-border"
                          placeholder="Enter new password (min. 8 characters)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-border"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button
                        onClick={handleChangePassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                        variant="gradient"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Social Account Linked</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your account is authenticated via a third-party provider. 
                          Password management is handled directly through your social account settings.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="border-primary/20 hover:bg-primary/10" asChild>
                          <a 
                            href={user?.email?.includes('google') ? "https://myaccount.google.com/security" : "https://github.com/settings/security"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Go to {user?.email?.includes('google') ? "Google" : "GitHub"} Security Settings
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">

              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about your diagrams</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="marketing">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about new features and tips</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={marketing}
                      onCheckedChange={setMarketing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Subscription */}
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$19/month • Next billing: Feb 20, 2024</p>
                </div>
                <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}

