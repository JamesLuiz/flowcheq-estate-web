import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NIGERIAN_STATES } from '@/data/nigerianStates';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Partners = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    city: '',
    state: 'FCT',
    address: '',
    propertyCount: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.partners.submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        city: form.city || undefined,
        state: form.state,
        address: form.address || undefined,
        propertyCount: form.propertyCount ? Number(form.propertyCount) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast({
        title: 'Thank you!',
        description: 'We received your details. Our team will contact you shortly.',
      });
      setForm({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        city: '',
        state: 'FCT',
        address: '',
        propertyCount: '',
        notes: '',
      });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Submission failed', description: e.message });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="container max-w-4xl py-12 md:py-16 text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              List your property with Flowcheq Estate
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Partner with us as a landlord. Share your details — we verify ownership, capture
              on-site photos, and list verified homes for serious tenants.
            </p>
          </div>
        </section>

        <div className="container max-w-xl py-10 pb-16">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>Landlord onboarding</CardTitle>
              <CardDescription>
                Initial registration only. We will call or message you to complete verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (WhatsApp)</Label>
                    <Input
                      id="phone"
                      required
                      placeholder="+2348012345678"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City / area</Label>
                    <Input
                      id="city"
                      placeholder="Wuse 2"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={form.state}
                      onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Property address (optional)</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">Number of properties you manage</Label>
                  <Input
                    id="count"
                    type="number"
                    min={0}
                    value={form.propertyCount}
                    onChange={(e) => setForm((f) => ({ ...f, propertyCount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Tell us about your property type, timeline, etc."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    'Submit — we will contact you'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center text-sm">
            {[
              'Verified listings only',
              'On-site GPS photos',
              'Legal document review',
            ].map((item) => (
              <div key={item} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/40">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
