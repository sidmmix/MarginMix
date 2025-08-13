import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isRegistering, registerError } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      company: "",
      agreeToTerms: false,
      agreeToPrivacy: false,
      consentGiven: false,
      marketingConsent: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await register(data);
      toast({
        title: "Registration successful",
        description: "Welcome to our platform!",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join our platform to start creating media campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {registerError && (
            <Alert variant="destructive">
              <AlertDescription>
                {registerError.message || "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...form.register("firstName")}
                disabled={isRegistering}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...form.register("lastName")}
                disabled={isRegistering}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register("email")}
              disabled={isRegistering}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              placeholder="Your Company"
              {...form.register("company")}
              disabled={isRegistering}
            />
            {form.formState.errors.company && (
              <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("password")}
                disabled={isRegistering}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isRegistering}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                disabled={isRegistering}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isRegistering}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Privacy & Terms</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={form.watch("agreeToTerms")}
                  onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
                  disabled={isRegistering}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreeToTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms of Service
                  </label>
                </div>
              </div>
              {form.formState.errors.agreeToTerms && (
                <p className="text-sm text-destructive">{form.formState.errors.agreeToTerms.message}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToPrivacy"
                  checked={form.watch("agreeToPrivacy")}
                  onCheckedChange={(checked) => form.setValue("agreeToPrivacy", !!checked)}
                  disabled={isRegistering}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreeToPrivacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Privacy Policy
                  </label>
                </div>
              </div>
              {form.formState.errors.agreeToPrivacy && (
                <p className="text-sm text-destructive">{form.formState.errors.agreeToPrivacy.message}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consentGiven"
                  checked={form.watch("consentGiven")}
                  onCheckedChange={(checked) => form.setValue("consentGiven", !!checked)}
                  disabled={isRegistering}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="consentGiven"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to the processing of my personal data (Required)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    We process your data to provide our services and improve your experience. You can withdraw consent at any time.
                  </p>
                </div>
              </div>
              {form.formState.errors.consentGiven && (
                <p className="text-sm text-destructive">{form.formState.errors.consentGiven.message}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketingConsent"
                  checked={form.watch("marketingConsent")}
                  onCheckedChange={(checked) => form.setValue("marketingConsent", !!checked)}
                  disabled={isRegistering}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="marketingConsent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I'd like to receive marketing communications (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Stay updated with product news, tips, and special offers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isRegistering}>
            {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/auth/google"}
            disabled={isRegistering}
            className="w-full"
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/auth/facebook"}
            disabled={isRegistering}
            className="w-full"
          >
            <FaFacebook className="mr-2 h-4 w-4" />
            Meta
          </Button>
        </div>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Button variant="link" onClick={onSwitchToLogin} className="p-0 h-auto">
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}