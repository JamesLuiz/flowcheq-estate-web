import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register } = useAuth();

  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    password: '',
    confirmPassword: '',
    role: 'agent',
  });

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);

    try {
      const user = await login(loginForm);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate(user.role === 'agent' || user.role === 'landlord' ? '/dashboard' : '/user-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: message,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
      });
      return;
    }

    setSignupLoading(true);

    try {
      const user = await register({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone,
        bio: signupForm.bio,
        role: signupForm.role,
      });

      toast({
        title: 'Account created!',
        description: `Your ${signupForm.role} account has been created successfully.`,
      });
      navigate(user.role === 'agent' || user.role === 'landlord' ? '/dashboard' : '/user-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register';
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: message,
      });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-hero rounded-full">
                <Home className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to House me</h1>
            <p className="text-muted-foreground">Login or create your account</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(event) =>
                          setLoginForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create your account</CardTitle>
                  <CardDescription>
                    Agents can start listing properties, while house hunters can save their favourites.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupForm.name}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupForm.email}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Account Type</Label>
                      <Select
                        value={signupForm.role}
                        onValueChange={(value) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            role: value,
                          }))
                        }
                      >
                        <SelectTrigger id="signup-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="user">House Hunter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={signupForm.phone}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-bio">Bio (optional)</Label>
                      <Input
                        id="signup-bio"
                        placeholder="Tell us a bit about yourself"
                        value={signupForm.bio}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            bio: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.confirmPassword}
                        onChange={(event) =>
                          setSignupForm((prev) => ({
                            ...prev,
                            confirmPassword: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={signupLoading}>
                      {signupLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
