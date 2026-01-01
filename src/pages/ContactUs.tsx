import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';

const ContactUs = () => {
  const form = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (form.current) {
      emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        form.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
        .then(() => {
          toast({
            title: "Message sent!",
            description: "We'll get back to you shortly.",
          });
          form.current?.reset();
        })
        .catch((error) => {
          toast({
            title: "Failed to send message",
            description: error.text || "Please try again later.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hello! I'd like to inquire about your properties.");
    window.open(`https://wa.me/2349152087229?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`https://wa.me/2349152087229`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-8">Contact Us</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card p-8 rounded-lg border">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form ref={form} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    name="name"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div>
                  <Textarea
                    name="message"
                    placeholder="Your Message"
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>

              <div className="mt-6">
                <Button onClick={handleWhatsApp} variant="outline" className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact via WhatsApp
                </Button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Abuja, Nigeria</h3>
                    <p className="text-muted-foreground">
                      Your Trusted Real Estate Platform<br />
                      Serving Abuja & Environs<br />
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Call Us</h3>
                    <p className="text-muted-foreground">
                      House me: <a href="https://wa.me/2349152087229" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">+234 915 208 7229</a><br />
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Email Us</h3>
                    <p className="text-muted-foreground">
                      House me: <a href="mailto:housemedream@gmail.com" className="hover:text-primary transition-colors">housemedream@gmail.com</a><br />
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Business Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Saturday: 9:00 AM - 8:00 PM<br />
                      Sunday: 10:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
