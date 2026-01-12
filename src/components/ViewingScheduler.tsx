import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, CalendarCheck, Loader2, User, Mail, Phone, CheckCircle, XCircle, Upload, FileText, Eye, RefreshCw, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ViewingSchedule {
  id: string;
  houseId: {
    id: string;
    title: string;
    location: string;
    images: string[];
  };
  userId: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  agentId: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  viewingFee?: number;
  paymentStatus?: string;
  receiptUrl?: string;
  amountPaid?: number;
  platformFee?: number;
  agentAmount?: number;
}

interface ViewingSchedulerProps {
  houseId: string;
  agentId: string;
  propertyTitle: string;
  viewingFee?: number;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export const ViewingScheduler = ({ houseId, agentId, propertyTitle, viewingFee }: ViewingSchedulerProps) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [scheduledViewingId, setScheduledViewingId] = useState<string | null>(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  const scheduleMutation = useMutation({
    mutationFn: (data: {
      houseId: string;
      agentId: string;
      scheduledDate: string;
      scheduledTime: string;
      notes?: string;
      name: string;
      email: string;
      phone?: string;
    }) => api.viewings.schedule(data),
    onSuccess: (response) => {
      // If there's a viewing fee, show payment step
      if (viewingFee && viewingFee > 0) {
        setScheduledViewingId(response.id);
        setShowPaymentStep(true);
        toast({
          title: 'Viewing Reserved',
          description: 'Please complete the payment to confirm your viewing.',
        });
      } else {
        toast({
          title: 'Viewing Scheduled',
          description: 'Your viewing request has been submitted. The agent will confirm shortly.',
        });
        setIsOpen(false);
        setDate(undefined);
        setTime('');
        setNotes('');
        queryClient.invalidateQueries({ queryKey: ['viewings'] });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Scheduling Failed',
        description: error.message,
      });
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: (viewingId: string) => api.viewings.initializePayment(viewingId),
    onSuccess: (response) => {
      if (response.paymentLink) {
        window.location.href = response.paymentLink;
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message,
      });
    },
  });

  const handleSchedule = () => {
    if (!date || !time) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a date and time for the viewing.',
      });
      return;
    }

    if (!name || !email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide your name and email.',
      });
      return;
    }

    // Prevent agent/owner from scheduling a viewing with themselves
    if (user?.id && user?.id === agentId) {
      toast({
        variant: 'destructive',
        title: 'Invalid action',
        description: 'You cannot schedule a viewing with your own listing.',
      });
      return;
    }

    scheduleMutation.mutate({
      houseId,
      agentId,
      scheduledDate: format(date, 'yyyy-MM-dd'),
      scheduledTime: time,
      notes,
      name,
      email,
      phone,
      // Include userId if user is logged in (backend will also set it, but this ensures it's there)
      ...(user?.id && { userId: user.id }),
    });
  };

  const handlePayment = () => {
    if (scheduledViewingId) {
      initializePaymentMutation.mutate(scheduledViewingId);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowPaymentStep(false);
    setScheduledViewingId(null);
    setDate(undefined);
    setTime('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" variant="outline">
          <CalendarCheck className="mr-2 h-5 w-5" />
          Schedule Viewing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showPaymentStep ? (
              <>
                <CreditCard className="h-5 w-5 text-primary" />
                Pay Viewing Fee
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 text-primary" />
                Schedule a Viewing
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showPaymentStep ? (
              <>Complete payment to confirm your viewing for: {propertyTitle}</>
            ) : (
              <>Book a time to view: {propertyTitle}</>
            )}
          </DialogDescription>
        </DialogHeader>

        {showPaymentStep ? (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">Viewing Details</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Date:</strong> {date && format(date, 'PPP')}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Time:</strong> {time}
              </p>
              <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-lg font-bold text-primary">
                  Viewing Fee: ₦{viewingFee?.toLocaleString()}
                </p>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={initializePaymentMutation.isPending}
              className="w-full"
              size="lg"
            >
              {initializePaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₦{viewingFee?.toLocaleString()}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You will be redirected to our secure payment partner to complete the transaction.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {viewingFee && viewingFee > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  This property requires a viewing fee of ₦{viewingFee.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  You will be prompted to pay after scheduling.
                </p>
              </div>
            )}

            {!isAuthenticated && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="+234..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot">
                    {time && (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {time}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {slot}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific questions or requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSchedule}
              disabled={scheduleMutation.isPending || !date || !time}
              className="w-full"
              size="lg"
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  {viewingFee && viewingFee > 0 ? 'Continue to Payment' : 'Confirm Viewing Request'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Agent/Landlord viewing management component
export const ViewingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rescheduleViewingId, setRescheduleViewingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [rescheduleTime, setRescheduleTime] = useState<string>('');

  const viewingsQuery = useQuery({
    queryKey: ['agent-viewings', user?.id],
    queryFn: () => api.viewings.getMyViewings(),
    enabled: !!user && (user.role === 'agent' || user.role === 'landlord'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, newDate, newTime }: { id: string; status: string; newDate?: string; newTime?: string }) =>
      api.viewings.updateStatus(id, status, newDate, newTime),
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Viewing status has been updated and notifications sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-viewings'] });
      setRescheduleViewingId(null);
      setRescheduleDate(undefined);
      setRescheduleTime('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  const handleReschedule = (viewingId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a new date and time.',
      });
      return;
    }

    updateStatusMutation.mutate({
      id: viewingId,
      status: 'rescheduled',
      newDate: format(rescheduleDate, 'yyyy-MM-dd'),
      newTime: rescheduleTime,
    });
  };

  const viewings = (viewingsQuery.data as ViewingSchedule[]) || [];
  const pendingCount = viewings.filter(v => v.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'} className="capitalize">{status}</Badge>;
  };

  if (viewingsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Viewing Requests
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage property viewing requests from potential buyers/tenants
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[60vh] overflow-y-auto">
        {viewings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No viewing requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {viewings.map((viewing) => (
              <details key={viewing.id} className="group border rounded-lg bg-background">
                <summary className="list-none p-4 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold">{viewing.houseId?.title}</h4>
                      <p className="text-sm text-muted-foreground">{format(new Date(viewing.scheduledDate), 'PPP')} at {viewing.scheduledTime}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(viewing.status)}
                      {viewing.paymentStatus && viewing.viewingFee && viewing.viewingFee > 0 && (
                        <Badge variant={viewing.paymentStatus === 'paid' ? 'default' : 'secondary'} className="ml-2">
                          {viewing.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Click to expand</div>
                </summary>

                <div className="p-4 border-t bg-background">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {viewing.userId?.name}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {viewing.userId?.email}
                        </p>
                        {viewing.userId?.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {viewing.userId.phone}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(viewing.scheduledDate), 'PPP')} at {viewing.scheduledTime}
                        </p>
                      </div>
                      {viewing.notes && (
                        <p className="text-sm bg-muted p-2 rounded-md">
                          <strong>Notes:</strong> {viewing.notes}
                        </p>
                      )}
                      {viewing.viewingFee && viewing.viewingFee > 0 && (
                        <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                          <p className="text-sm font-semibold text-primary">
                            Viewing Fee: ₦{viewing.viewingFee.toLocaleString()}
                          </p>
                          {viewing.amountPaid && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Your share: ₦{viewing.agentAmount?.toLocaleString()} (Platform: {viewing.platformFee}%)
                            </p>
                          )}
                        </div>
                      )}
                      {viewing.receiptUrl && (
                        <div className="p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Receipt uploaded by user</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(viewing.receiptUrl, '_blank')}
                              className="h-6 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {viewing.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: viewing.id, status: 'confirmed' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Dialog open={rescheduleViewingId === viewing.id} onOpenChange={(open) => {
                            if (!open) {
                              setRescheduleViewingId(null);
                              setRescheduleDate(undefined);
                              setRescheduleTime('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRescheduleViewingId(viewing.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reschedule
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reschedule Viewing</DialogTitle>
                                <DialogDescription>
                                  Select a new date and time for the viewing. The user will be notified.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>New Date</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'w-full justify-start text-left font-normal',
                                          !rescheduleDate && 'text-muted-foreground'
                                        )}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {rescheduleDate ? format(rescheduleDate, 'PPP') : 'Pick a date'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={rescheduleDate}
                                        onSelect={setRescheduleDate}
                                        disabled={(date) => date < new Date() || date.getDay() === 0}
                                        initialFocus
                                        className="pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <Label>New Time</Label>
                                  <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a time slot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map((slot) => (
                                        <SelectItem key={slot} value={slot}>
                                          {slot}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRescheduleViewingId(null);
                                    setRescheduleDate(undefined);
                                    setRescheduleTime('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleReschedule(viewing.id)}
                                  disabled={updateStatusMutation.isPending || !rescheduleDate || !rescheduleTime}
                                >
                                  {updateStatusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Confirm Reschedule
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {viewing.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: viewing.id, status: 'completed' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// User viewing management component - for uploading receipts
export const UserViewingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const receiptInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(null);

  // For users to see their scheduled viewings
  const viewingsQuery = useQuery({
    queryKey: ['user-viewings', user?.id],
    queryFn: () => api.viewings.getUserViewings(),
    // Enable for any authenticated non-agent/non-landlord/admin users
    enabled: !!user && user.role !== 'agent' && user.role !== 'landlord' && user.role !== 'admin',
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.viewings.uploadReceipt(id, file),
    onSuccess: () => {
      toast({
        title: 'Receipt uploaded',
        description: 'Your payment receipt has been uploaded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-viewings'] });
      setUploadingReceiptId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
      setUploadingReceiptId(null);
    },
  });

  const handleReceiptSelect = (viewingId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Receipt file size must be less than 5MB',
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WEBP image',
      });
      return;
    }

    setUploadingReceiptId(viewingId);
    uploadReceiptMutation.mutate({ id: viewingId, file });
  };

  const viewings = (viewingsQuery.data as ViewingSchedule[]) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'} className="capitalize">{status}</Badge>;
  };

  // Only hide this component for agent/landlord/admin users
  if (!user || user.role === 'agent' || user.role === 'landlord' || user.role === 'admin') {
    return null;
  }

  if (viewingsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (viewingsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            My Scheduled Viewings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load viewings</p>
            <Button
              variant="outline"
              onClick={() => viewingsQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            My Scheduled Viewings
          </CardTitle>
          <CardDescription>
            View and manage your property viewing appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No scheduled viewings yet</p>
            <p className="text-sm text-muted-foreground">
              Schedule a viewing from any property listing to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          My Scheduled Viewings
        </CardTitle>
        <CardDescription>
          View and manage your property viewing appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viewings.map((viewing) => (
            <Card key={viewing.id} className="border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{viewing.houseId?.title}</h4>
                    {getStatusBadge(viewing.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(viewing.scheduledDate), 'PPP')} at {viewing.scheduledTime}
                    </p>
                    <p className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      Agent: {viewing.agentId?.name}
                    </p>
                  </div>

                  {viewing.viewingFee && viewing.viewingFee > 0 && (
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                      <p className="text-sm font-semibold text-primary">
                        Viewing Fee: ₦{viewing.viewingFee.toLocaleString()}
                      </p>
                      {viewing.paymentStatus && (
                        <Badge 
                          variant={viewing.paymentStatus === 'paid' ? 'default' : 'secondary'} 
                          className="mt-2"
                        >
                          {viewing.paymentStatus}
                        </Badge>
                      )}
                      
                      {/* Receipt Upload Section - Only for users */}
                      {viewing.paymentStatus !== 'paid' && !viewing.receiptUrl && (
                        <div className="mt-3 pt-3 border-t border-primary/20">
                          <Label className="text-sm font-medium">Upload Payment Receipt</Label>
                          <input
                            ref={(el) => {
                              receiptInputRefs.current[viewing.id] = el;
                            }}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleReceiptSelect(viewing.id, e)}
                            className="hidden"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => receiptInputRefs.current[viewing.id]?.click()}
                            disabled={uploadingReceiptId === viewing.id}
                            className="w-full mt-2"
                          >
                            {uploadingReceiptId === viewing.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Receipt
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Max 5MB, JPG/PNG/WEBP
                          </p>
                        </div>
                      )}

                      {viewing.receiptUrl && (
                        <div className="mt-3 pt-3 border-t border-primary/20">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm">Receipt uploaded</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(viewing.receiptUrl, '_blank')}
                              className="h-6 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
