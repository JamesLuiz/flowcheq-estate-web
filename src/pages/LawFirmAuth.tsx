import { FormEvent, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale, Upload, X, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'mail.com', 'protonmail.com', 'icloud.com', 'live.com', 'msn.com',
  'ymail.com', 'googlemail.com',
];

const LawFirmAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    firmName: '',
    barRegistrationNumber: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    state: 'Lagos',
    website: '',
  });

  const validateFirmEmail = (email: string): boolean => {
    if (!email) return true;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    if (BLOCKED_DOMAINS.includes(domain)) {
      setEmailError(`Firm emails cannot use ${domain}. Use your law firm domain.`);
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Upload a PDF or image (JPG, PNG).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
      });
      return;
    }

    setCertificateFile(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formState.password !== formState.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
      });
      return;
    }

    if (!validateFirmEmail(formState.email) || !validateFirmEmail(formState.businessEmail)) {
      return;
    }

    if (!certificateFile) {
      toast({
        variant: 'destructive',
        title: 'Certificate required',
        description: 'Upload your NBA practicing certificate.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.registerLawFirm({
        name: formState.name,
        email: formState.email,
        password: formState.password,
        phone: formState.phone || undefined,
        bio: formState.bio || undefined,
        lawFirmDetails: {
          firmName: formState.firmName,
          barRegistrationNumber: formState.barRegistrationNumber,
          businessEmail: formState.businessEmail,
          businessPhone: formState.businessPhone,
          address: formState.address,
          city: formState.city,
          state: formState.state,
          website: formState.website || undefined,
        },
        practicingCertificate: certificateFile,
      });

      toast({
        title: 'Registration submitted',
        description: 'Your law firm partner account is pending admin approval.',
      });
      navigate('/auth');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Register as a Law Firm Partner</CardTitle>
                  <CardDescription>
                    Partner with Flowcheq Estate to review property ownership documents and C of O.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use your firm domain email. Accounts are reviewed by our admin team before dashboard access.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Lead partner account
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name">Contact name *</Label>
                      <Input
                        id="name"
                        value={formState.name}
                        onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Login email (firm domain) *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formState.email}
                        onChange={(e) => {
                          setFormState((p) => ({ ...p, email: e.target.value }));
                          validateFirmEmail(e.target.value);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => setFormState((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive sm:col-span-2">{emailError}</p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <PasswordInput
                        id="password"
                        value={formState.password}
                        onChange={(e) => setFormState((p) => ({ ...p, password: e.target.value }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password *</Label>
                      <PasswordInput
                        id="confirmPassword"
                        value={formState.confirmPassword}
                        onChange={(e) => setFormState((p) => ({ ...p, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Firm details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="firmName">Law firm name *</Label>
                      <Input
                        id="firmName"
                        value={formState.firmName}
                        onChange={(e) => setFormState((p) => ({ ...p, firmName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barId">Bar / NBA registration *</Label>
                      <Input
                        id="barId"
                        placeholder="NBA/ABJ/12345"
                        value={formState.barRegistrationNumber}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, barRegistrationNumber: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Firm email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={formState.businessEmail}
                        onChange={(e) => {
                          setFormState((p) => ({ ...p, businessEmail: e.target.value }));
                          validateFirmEmail(e.target.value);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Firm phone *</Label>
                      <Input
                        id="businessPhone"
                        value={formState.businessPhone}
                        onChange={(e) => setFormState((p) => ({ ...p, businessPhone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formState.website}
                        onChange={(e) => setFormState((p) => ({ ...p, website: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Office address *</Label>
                      <Input
                        id="address"
                        value={formState.address}
                        onChange={(e) => setFormState((p) => ({ ...p, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formState.city}
                        onChange={(e) => setFormState((p) => ({ ...p, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Select
                        value={formState.state}
                        onValueChange={(value) => setFormState((p) => ({ ...p, state: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="bio">About the firm (optional)</Label>
                      <Textarea
                        id="bio"
                        rows={3}
                        value={formState.bio}
                        onChange={(e) => setFormState((p) => ({ ...p, bio: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Practicing certificate *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {certificateFile ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <Upload className="h-4 w-4 text-primary" />
                      <span className="text-sm flex-1 truncate">{certificateFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCertificateFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload certificate (PDF or image, max 5MB)
                    </Button>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit for approval'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already registered?{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LawFirmAuth;
