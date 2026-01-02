import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, 
  Trash2, 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Calendar,
  Shield,
  TrendingUp,
  FileText,
  Phone
} from 'lucide-react';

const AgentGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Agent & Landlord Guide
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about managing your properties on House Me
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Getting Started
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Create Your Account</h3>
                  <p className="text-muted-foreground">Sign up as an Agent or Landlord to access property management features.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">Complete Verification</h3>
                  <p className="text-muted-foreground">Upload your NIN or Driver's License along with a selfie to get verified. Verified agents get more visibility and trust.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Start Listing Properties</h3>
                  <p className="text-muted-foreground">Once verified, you can add properties with detailed descriptions, images, and pricing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Adding Properties */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Adding Properties
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">To add a new property:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Go to your Dashboard</li>
                <li>Click "Add New Property"</li>
                <li>Fill in all required fields including title, description, price, and location</li>
                <li>Upload 3-5 high-quality images</li>
                <li>Set property type, bedrooms, bathrooms, and area</li>
                <li>Optionally mark as "Featured" for premium visibility</li>
              </ul>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="text-sm font-medium text-primary">Pro Tip:</p>
                <p className="text-sm text-muted-foreground">Use the rich text editor to format your description with bullet points, bold text, and proper formatting to make your listing stand out.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Shared Properties (2-to-Tango) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Shared Properties (2-to-Tango)
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                The 2-to-Tango feature allows you to list properties for multiple tenants to share:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Toggle "Shared Property" when creating a listing</li>
                <li>Set the number of available slots (e.g., 2-4 tenants)</li>
                <li>Each tenant books their own slot</li>
                <li>Tenants can view each other's basic profiles</li>
                <li>Property automatically marks as "Fully Booked" when all slots are filled</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Managing Viewings */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Managing Viewings
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                When potential tenants schedule viewings:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You'll receive an email notification with their details</li>
                <li>View all scheduled viewings in your Dashboard</li>
                <li>Confirm, reschedule, or cancel viewings as needed</li>
                <li>The tenant will be notified of any status changes</li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mt-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important:</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Respond to viewing requests promptly. Quick responses lead to higher conversion rates!</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Removing Properties */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-destructive" />
            Removing Sold or Rented Properties
          </h2>
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Important: Keep Your Listings Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Please remove properties that are no longer available</strong> to maintain trust with potential tenants and keep our platform accurate.
              </p>
              <div className="bg-destructive/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">When to Remove a Property:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>The property has been <strong>sold</strong></li>
                  <li>The property has been <strong>rented</strong></li>
                  <li>The property is <strong>no longer available</strong> for any reason</li>
                  <li>You are <strong>no longer managing</strong> this property</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How to Remove a Property:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to your Dashboard</li>
                  <li>Find the property you want to remove</li>
                  <li>Click the <strong className="text-destructive">Delete</strong> button (trash icon)</li>
                  <li>Confirm the deletion</li>
                </ol>
              </div>
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Benefits of Keeping Listings Updated:</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    <li>• Maintains your professional reputation</li>
                    <li>• Reduces irrelevant inquiries</li>
                    <li>• Helps potential tenants find available properties</li>
                    <li>• Improves overall platform experience</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Editing Properties */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            Editing Properties
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                You can update your property listings at any time:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Update price when rates change</li>
                <li>Modify description to add new features</li>
                <li>Change property details (bedrooms, area, etc.)</li>
                <li>Update location information</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Analytics & Performance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Analytics & Performance
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Track how your properties are performing:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Total Views</p>
                  <p className="text-sm text-muted-foreground">How many times your properties have been viewed</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Active Listings</p>
                  <p className="text-sm text-muted-foreground">Number of properties you currently have listed</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Inquiries</p>
                  <p className="text-sm text-muted-foreground">Potential leads and viewing requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Support */}
        <section className="mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Need Help?</h2>
              <p className="text-muted-foreground mb-4">
                Our support team is here to assist you with any questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://wa.me/2349152087229" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp Support
                </a>
                <a 
                  href="mailto:housemedream@gmail.com"
                  className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Email Support
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AgentGuide;
