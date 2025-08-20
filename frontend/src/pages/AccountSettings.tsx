import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AccountSettings() {
  return (
    <div className="p-3">
      <div className="container max-w-3xl space-y-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account settings and preferences.
          </p>
        </div>
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="mb-1">Personal Information</CardTitle>
            <CardDescription className="text-sm mt-2">
              Update your personal information and how others see you on the
              platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src="/placeholder.svg?height=80&width=80"
                  alt="Profile picture"
                />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button size="sm">Upload new picture</Button>
                <p className="text-xs text-muted-foreground">
                  JPG, GIF or PNG. 1MB max.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.doe@example.com"
              />
              <p className="text-xs text-muted-foreground">
                This email will be used for account-related notifications.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a little about yourself"
                defaultValue="Product designer based in New York, passionate about creating intuitive and beautiful user experiences."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Brief description for your profile. URLs are hyperlinked.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-4 py-2">
            <Button variant="outline">Cancel</Button>
            <Button size={"sm"}>Save changes</Button>
          </CardFooter>
        </Card>
        <Card className="rounded-md shadow-none mt-4">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="!mt-2">
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters and include a number and
                a special character.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button size="sm">Update password</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
