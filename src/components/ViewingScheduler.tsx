import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, CalendarCheck, Loader2, User, Mail, Phone, X, CheckCircle, XCircle } from 'lucide-react';
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
}

interface ViewingSchedulerProps {
  houseId: string;
  agentId: string;
  propertyTitle: string;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export const ViewingScheduler = ({ houseId, agentId, propertyTitle }: ViewingSchedulerProps) => {
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
    onSuccess: () => {
      toast({
        title: 'Viewing Scheduled',
        description: 'Your viewing request has been submitted. The agent will confirm shortly.',
      });
      setIsOpen(false);
      setDate(undefined);
      setTime('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['viewings'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Scheduling Failed',
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

    scheduleMutation.mutate({
      houseId,
      agentId,
      scheduledDate: format(date, 'yyyy-MM-dd'),
      scheduledTime: time,
      notes,
      name,
      email,
      phone,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" variant="outline">
          <CalendarCheck className="mr-2 h-5 w-5" />
          Schedule Viewing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule a Viewing
          </DialogTitle>
          <DialogDescription>
            Book a time to view: {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
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
                Confirm Viewing Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Agent/Landlord viewing management component
export const ViewingManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const viewingsQuery = useQuery({
    queryKey: ['agent-viewings', user?.id],
    queryFn: () => api.viewings.getMyViewings(),
    enabled: !!user && (user.role === 'agent' || user.role === 'landlord'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.viewings.updateStatus(id, status),
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Viewing status has been updated and notifications sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-viewings'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

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
      <CardContent>
        {viewings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No viewing requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {viewings.map((viewing) => (
              <Card key={viewing.id} className="border">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{viewing.houseId?.title}</h4>
                        {getStatusBadge(viewing.status)}
                      </div>
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
                    </div>

                    {viewing.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: viewing.id, status: 'confirmed' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ id: viewing.id, status: 'cancelled' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
