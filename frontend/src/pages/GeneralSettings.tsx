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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Mail, Phone } from "lucide-react";

export default function GeneralSettings() {
  return (
    <div className="p-3">
      <div className="container max-w-3xl space-y-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your organization's general information and settings.
          </p>
        </div>

        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Update your organization's profile and public information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="w-20 h-20">
                <AvatarImage
                  src="/placeholder.svg?height=80&width=80"
                  alt="Organization logo"
                />
                <AvatarFallback>
                  <Building2 className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button size="sm">Upload new logo</Button>
                <p className="text-xs text-muted-foreground">
                  SVG, PNG or JPG. 2MB max.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input id="orgName" defaultValue="Acme Inc." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="orgDescription">Description</Label>
              <Textarea
                id="orgDescription"
                placeholder="Describe your organization"
                defaultValue="Acme Inc. is a leading provider of innovative solutions for businesses of all sizes."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Brief description of your organization. This will appear on your
                public profile.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Select defaultValue="technology">
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="size">Organization size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">1-10 members</SelectItem>
                    <SelectItem value="medium">11-50 members</SelectItem>
                    <SelectItem value="large">51-200 members</SelectItem>
                    <SelectItem value="enterprise">201+ members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <div className="relative">
                <MapPin className="absolute z-10 left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Street address"
                  defaultValue="123 Main St"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Contact email</Label>
                <div className="relative">
                  <Mail className="absolute z-10 left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    className="pl-8"
                    type="email"
                    defaultValue="contact@acme.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Contact phone</Label>
                <div className="relative">
                  <Phone className="absolute z-10 left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-8"
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button size="sm" variant="outline">
              Cancel
            </Button>
            <Button size="sm">Save organization</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
