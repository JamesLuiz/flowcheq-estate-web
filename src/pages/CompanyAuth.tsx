import { FormEvent, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Nigerian states list
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

// Blocked email domains
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'mail.com', 'protonmail.com', 'icloud.com', 'live.com', 'msn.com',
  'ymail.com', 'googlemail.com',
];

const CompanyAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    // Account credentials
    name: '', // Contact person name
    email: '', // Login email (business email)
    password: '',
    confirmPassword: '',
    phone: '', // Contact person phone
    
    // Company details
    companyName: '',
    cacNumber: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    state: 'Lagos',
    website: '',
    yearEstablished: '',
    companySize: '',
    bio: '',
  });

  const validateBusinessEmail = (email: string): boolean => {
    if (!email) return true; // Will be caught by required validation
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    if (BLOCKED_DOMAINS.includes(domain)) {
      setEmailError(`Business emails cannot use ${domain}. Please use your company domain email.`);
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (field: 'email' | 'businessEmail', value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    if (field === 'businessEmail' || field === 'email') {
      validateBusinessEmail(value);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a PDF or image file (JPG, PNG).',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
        });
        return;
      }
      
      setCacFile(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords match
    if (formState.password !== formState.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
      });
      return;
    }

    // Validate business email
    if (!validateBusinessEmail(formState.businessEmail)) {
      return;
    }

    // Validate CAC document
    if (!cacFile) {
      toast({
        variant: 'destructive',
        title: 'CAC document required',
        description: 'Please upload your CAC registration certificate.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.registerCompany({
        name: formState.name,
        email: formState.email,
        password: formState.password,
        phone: formState.phone,
        bio: formState.bio,
        companyDetails: {
          companyName: formState.companyName,
          cacNumber: formState.cacNumber,
          businessEmail: formState.businessEmail,
          businessPhone: formState.businessPhone,
          address: formState.address,
          city: formState.city,
          state: formState.state,
          website: formState.website || undefined,
          yearEstablished: formState.yearEstablished ? Number(formState.yearEstablished) : undefined,
          companySize: formState.companySize || undefined,
        },
        cacDocument: cacFile,
      });

      toast({
        title: 'Registration submitted!',
        description: 'Your company registration is under review. We will notify you once verified.',
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
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-hero rounded-full">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Register Your Real Estate Company</h1>
            <p className="text-muted-foreground">
              List properties as a verified business entity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Company Registration</CardTitle>
              <CardDescription>
                Please provide your company details and CAC certification for verification.
                Already have an account? <Link to="/auth" className="text-primary hover:underline">Login here</Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Person Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Person</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={formState.phone}
                        onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Company Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="ABC Real Estate Limited"
                      value={formState.companyName}
                      onChange={(e) => setFormState(prev => ({ ...prev, companyName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cacNumber">CAC Registration Number *</Label>
                      <Input
                        id="cacNumber"
                        placeholder="RC123456"
                        value={formState.cacNumber}
                        onChange={(e) => setFormState(prev => ({ ...prev, cacNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Year Established</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        placeholder="2010"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formState.yearEstablished}
                        onChange={(e) => setFormState(prev => ({ ...prev, yearEstablished: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* CAC Document Upload */}
                  <div className="space-y-2">
                    <Label>CAC Certificate *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {cacFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-sm">{cacFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCacFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Upload your CAC registration certificate
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Select File
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, or PNG (max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        placeholder="info@yourcompany.com"
                        value={formState.businessEmail}
                        onChange={(e) => handleEmailChange('businessEmail', e.target.value)}
                        required
                      />
                      {emailError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {emailError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone *</Label>
                      <Input
                        id="businessPhone"
                        type="tel"
                        placeholder="+234 1 234 5678"
                        value={formState.businessPhone}
                        onChange={(e) => setFormState(prev => ({ ...prev, businessPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Office Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Business Street"
                      value={formState.address}
                      onChange={(e) => setFormState(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Lagos"
                        value={formState.city}
                        onChange={(e) => setFormState(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={formState.state}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, state: value }))}
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={formState.website}
                        onChange={(e) => setFormState(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Select
                        value={formState.companySize}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, companySize: value }))}
                      >
                        <SelectTrigger id="companySize">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="200+">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Company Description</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your company..."
                      value={formState.bio}
                      onChange={(e) => setFormState(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Login Credentials Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Login Credentials</h3>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Use your business email for login. Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="email">Login Email (Business Email) *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@yourcompany.com"
                      value={formState.email}
                      onChange={(e) => handleEmailChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formState.password}
                        onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formState.confirmPassword}
                        onChange={(e) => setFormState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !!emailError}>
                  {isLoading ? 'Submitting...' : 'Submit for Verification'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By registering, you agree to our Terms of Service and Privacy Policy.
                  Your company details will be verified before activation.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyAuth;
