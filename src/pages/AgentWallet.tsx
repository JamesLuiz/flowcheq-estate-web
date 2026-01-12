import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  TrendingUp, 
  Building2, 
  Loader2, 
  Check, 
  X, 
  Clock, 
  ArrowLeft,
  CreditCard,
  Settings,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';

const AgentWallet = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(110);
  const [pinAttempts, setPinAttempts] = useState(3);
  const [isBankSettingsOpen, setIsBankSettingsOpen] = useState(false);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
  const [isPinResetDialogOpen, setIsPinResetDialogOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPinAfterReset, setNewPinAfterReset] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showWithdrawPin, setShowWithdrawPin] = useState(false);
  const [showResetCode, setShowResetCode] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);
  const [pendingWithdrawPin, setPendingWithdrawPin] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  // OTP countdown timer
  useEffect(() => {
    if (isOtpDialogOpen && otpExpiresAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiresAt.getTime() - Date.now()) / 1000));
        setOtpCountdown(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOtpDialogOpen, otpExpiresAt]);

  const bankAccountQuery = useQuery({
    queryKey: ['bank-account'],
    queryFn: () => api.agents.getBankAccount(),
    enabled: isAuthenticated && (user?.role === 'agent' || user?.role === 'landlord'),
  });

  const pinStatusQuery = useQuery({
    queryKey: ['transaction-pin-status'],
    queryFn: () => api.agents.getTransactionPinStatus(),
    enabled: isAuthenticated && (user?.role === 'agent' || user?.role === 'landlord'),
  });

  const earningsQuery = useQuery<{ earnings: any[]; stats: { totalEarnings: number; totalGross: number; totalPlatformFees: number; transactionCount: number } }>({
    queryKey: ['earnings'],
    queryFn: () => api.agents.getEarnings(),
    enabled: isAuthenticated && (user?.role === 'agent' || user?.role === 'landlord'),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => api.agents.getWithdrawals(),
    enabled: isAuthenticated && (user?.role === 'agent' || user?.role === 'landlord'),
  });

  const updateBankMutation = useMutation({
    mutationFn: (data: { bankName: string; accountNumber: string; accountName: string; bankCode: string }) =>
      api.agents.updateBankAccount(data),
    onSuccess: () => {
      toast({ title: 'Bank account updated', description: 'Your bank details have been saved.' });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      setIsBankSettingsOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to update', description: error.message });
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => api.agents.requestWithdrawalOtp(),
    onSuccess: (data: any) => {
      const expiresAt = new Date(data.expiresAt);
      setOtpExpiresAt(expiresAt);
      setOtpCountdown(110);
      setIsPinDialogOpen(false);
      setIsOtpDialogOpen(true);
      toast({ 
        title: 'OTP sent', 
        description: 'A 6-character OTP has been sent to your email. It expires in 1 minute 50 seconds.' 
      });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, pin, otp }: { amount: number; pin: string; otp: string }) => 
      api.agents.withdraw(amount, pin, otp),
    onSuccess: (data) => {
      toast({ 
        title: 'Withdrawal initiated', 
        description: (data as any).message || 'Your funds are being transferred. You will receive an email confirmation.' 
      });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setIsWithdrawDialogOpen(false);
      setIsPinDialogOpen(false);
      setIsOtpDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawPin('');
      setWithdrawOtp('');
      setPendingWithdrawAmount(null);
      setPendingWithdrawPin('');
      setPinAttempts(3);
    },
    onError: (error: Error) => {
      console.error('Withdrawal error:', error);
      const errorMessage = error.message || 'Failed to process withdrawal.';
      
      // Check if it's an OTP error
      if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('expired')) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid OTP', 
          description: errorMessage 
        });
        setWithdrawOtp('');
        return;
      }
      
      // Check if it's a PIN locked error
      if (errorMessage.includes('locked') || errorMessage.includes('Locked')) {
        setIsOtpDialogOpen(false);
        setIsPinDialogOpen(false);
        setWithdrawPin('');
        setPinAttempts(0);
        toast({ 
          variant: 'destructive', 
          title: 'PIN Locked', 
          description: errorMessage.includes('Try again in') 
            ? errorMessage 
            : 'Too many failed attempts. PIN is locked for 30 minutes.' 
        });
        return;
      }
      
      toast({ variant: 'destructive', title: 'Withdrawal failed', description: errorMessage });
    },
  });

  const requestPinResetMutation = useMutation({
    mutationFn: () => api.agents.requestTransactionPinReset(),
    onSuccess: () => {
      setResetCodeSent(true);
      toast({ 
        title: 'Reset code sent', 
        description: 'A 6-digit code has been sent to your email. It expires in 15 minutes.' 
      });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to send code', description: error.message });
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: ({ code, newPin }: { code: string; newPin: string }) => api.agents.resetTransactionPin(code, newPin),
    onSuccess: () => {
      toast({ 
        title: 'PIN reset successful', 
        description: 'Your transaction PIN has been reset. You can now use it for withdrawals.' 
      });
      queryClient.invalidateQueries({ queryKey: ['transaction-pin-status'] });
      setIsPinResetDialogOpen(false);
      setResetCode('');
      setNewPinAfterReset('');
      setConfirmNewPin('');
      setResetCodeSent(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Reset failed', description: error.message });
    },
  });

  const setPinMutation = useMutation({
    mutationFn: (pin: string) => api.agents.setTransactionPin(pin),
    onSuccess: () => {
      toast({ 
        title: 'Transaction PIN set', 
        description: 'Your transaction PIN has been set successfully.' 
      });
      queryClient.invalidateQueries({ queryKey: ['transaction-pin-status'] });
      setIsPinSettingsOpen(false);
      setPin('');
      setConfirmPin('');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to set PIN', description: error.message });
    },
  });

  const fundWalletMutation = useMutation({
    mutationFn: (amount: number) => api.agents.fundWallet(amount),
    onSuccess: (data: any) => {
      if (data.paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = data.paymentLink;
      } else {
        toast({ 
          title: 'Funding initiated', 
          description: 'Redirecting to payment page...' 
        });
      }
    },
    onError: (error: Error) => {
      console.error('Funding error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Funding failed', 
        description: error.message || 'Failed to initialize funding. Please try again.' 
      });
    },
  });

  const handleWithdrawAmount = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid amount' });
      return;
    }
    if (amount < 100) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Minimum withdrawal is ₦100' });
      return;
    }
    if (amount > walletBalance) {
      toast({ variant: 'destructive', title: 'Insufficient balance', description: `You can only withdraw up to ₦${walletBalance.toLocaleString()}` });
      return;
    }
    // Store amount and open PIN dialog
    setPendingWithdrawAmount(amount);
    setIsWithdrawDialogOpen(false);
    setIsPinDialogOpen(true);
    setPinAttempts(3); // Reset attempts
    setWithdrawPin(''); // Clear PIN
  };

  const handleVerifyPin = () => {
    if (!withdrawPin || withdrawPin.length !== 6) {
      toast({ variant: 'destructive', title: 'PIN required', description: 'Please enter your 6-digit transaction PIN' });
      return;
    }
    if (!pendingWithdrawAmount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Withdrawal amount not set' });
      return;
    }
    // Store PIN and request OTP
    setPendingWithdrawPin(withdrawPin);
    requestOtpMutation.mutate();
  };

  const handleVerifyOtp = () => {
    if (!withdrawOtp || withdrawOtp.length !== 6) {
      toast({ variant: 'destructive', title: 'OTP required', description: 'Please enter the 6-character OTP from your email' });
      return;
    }
    if (!pendingWithdrawAmount || !pendingWithdrawPin) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session expired. Please start over.' });
      setIsOtpDialogOpen(false);
      return;
    }
    // Process withdrawal with PIN and OTP
    withdrawMutation.mutate({ amount: pendingWithdrawAmount, pin: pendingWithdrawPin, otp: withdrawOtp });
  };

  const handleSetPin = () => {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be exactly 6 digits' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ variant: 'destructive', title: 'PIN mismatch', description: 'PINs do not match' });
      return;
    }
    setPinMutation.mutate(pin);
  };

  const handleBankUpdate = () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName || !bankForm.bankCode) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill all bank details' });
      return;
    }
    updateBankMutation.mutate(bankForm);
  };

  const walletBalance = bankAccountQuery.data?.walletBalance || 0;
  const bankAccount = bankAccountQuery.data?.bankAccount;
  const earnings = earningsQuery.data?.earnings || [];
  const stats = earningsQuery.data?.stats || { 
    totalEarnings: 0, 
    totalGross: 0, 
    totalPlatformFees: 0, 
    transactionCount: 0 
  };
  const withdrawals = withdrawalsQuery.data?.withdrawals || [];

  // Handle funding callback
  useEffect(() => {
    const funded = searchParams.get('funded');
    const amount = searchParams.get('amount');
    
    if (funded === 'true') {
      toast({
        title: 'Wallet funded successfully',
        description: `₦${amount ? parseFloat(amount).toLocaleString() : ''} has been added to your virtual account.`,
      });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      setSearchParams({});
    } else if (funded === 'pending') {
      toast({
        title: 'Payment successful',
        description: 'Your payment was successful. Funds will be added to your wallet shortly.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      setSearchParams({});
    } else if (funded === 'failed') {
      toast({
        title: 'Payment failed',
        description: 'Payment verification failed. Please try again.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams, toast, queryClient, setSearchParams]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      successful: { variant: 'default', icon: <Check className="h-3 w-3" /> },
      processing: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      pending: { variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      failed: { variant: 'destructive', icon: <X className="h-3 w-3" /> },
      cancelled: { variant: 'destructive', icon: <X className="h-3 w-3" /> },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1 capitalize">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (!isAuthenticated || (user?.role !== 'agent' && user?.role !== 'landlord')) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground mb-4">
                Only agents and landlords can access the wallet.
              </p>
              <Link to="/auth">
                <Button>Login as Agent</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Wallet & Earnings
            </h1>
            <p className="text-muted-foreground mt-2">
              View your earnings and manage withdrawals
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPinSettingsOpen} onOpenChange={setIsPinSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  {pinStatusQuery.data?.hasPin ? 'PIN Set' : 'Set PIN'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{pinStatusQuery.data?.hasPin ? 'Update' : 'Set'} Transaction PIN</DialogTitle>
                  <DialogDescription>
                    {pinStatusQuery.data?.hasPin 
                      ? 'Enter a new 6-digit PIN to update your transaction PIN'
                      : "Set a 6-digit PIN to secure your withdrawals. You'll need this PIN for all withdrawals."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Transaction PIN (6 digits)</Label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        placeholder="Enter 6-digit PIN"
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setPin(value);
                        }}
                        maxLength={6}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm PIN</Label>
                    <Input
                      type={showPin ? 'text' : 'password'}
                      placeholder="Confirm 6-digit PIN"
                      value={confirmPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setConfirmPin(value);
                      }}
                      maxLength={6}
                    />
                  </div>
                  {!pinStatusQuery.data?.hasPin && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You must set a transaction PIN before you can withdraw funds.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPinSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetPin} disabled={setPinMutation.isPending || pin.length !== 6 || confirmPin.length !== 6}>
                    {setPinMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting...</>
                    ) : (
                      pinStatusQuery.data?.hasPin ? 'Update PIN' : 'Set PIN'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isBankSettingsOpen} onOpenChange={setIsBankSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                  if (bankAccount) {
                    setBankForm({
                      bankName: bankAccount.bankName || '',
                      bankCode: bankAccount.bankCode || '',
                      accountNumber: bankAccount.accountNumber || '',
                      accountName: bankAccount.accountName || '',
                    });
                  }
                }}>
                  <Settings className="mr-2 h-4 w-4" />
                  Bank Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bank Account Settings</DialogTitle>
                  <DialogDescription>
                    Set up your bank account for withdrawals via Flutterwave
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Select
                      value={bankForm.bankCode}
                      onValueChange={(code) => {
                        const bank = NIGERIAN_BANKS.find(b => b.code === code);
                        setBankForm(prev => ({
                          ...prev,
                          bankCode: code,
                          bankName: bank?.name || '',
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {NIGERIAN_BANKS.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="Enter 10-digit account number"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      placeholder="Enter account holder name"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBankSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBankUpdate} disabled={updateBankMutation.isPending}>
                    {updateBankMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save Bank Details'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <h2 className="text-4xl md:text-5xl font-bold text-primary">
                    ₦{stats.totalEarnings?.toLocaleString() || 0}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    All-time earnings from viewing fees
                  </p>
                </div>
                <div className="border-l pl-6">
                  <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    ₦{walletBalance.toLocaleString()}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ready for withdrawal
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" variant="outline" className="bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300">
                        <ArrowDownToLine className="mr-2 h-5 w-5" />
                        Fund Wallet
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
                      <DialogHeader>
                        <DialogTitle>Fund Virtual Account</DialogTitle>
                        <DialogDescription>
                          Add funds to your virtual account from your bank
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2 sm:py-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Amount (₦)</Label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            min={100}
                            className="text-base"
                          />
                          <p className="text-xs text-muted-foreground break-words">
                            Minimum: ₦100
                          </p>
                        </div>
                        {bankAccountQuery.data?.virtualAccount && (
                          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                              <strong>Note:</strong> Funds will be added to your virtual account after payment is confirmed. You can use these funds for promotions or withdraw to your bank account.
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsFundDialogOpen(false);
                            setFundAmount('');
                          }}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            const amount = parseFloat(fundAmount);
                            if (isNaN(amount) || amount < 100) {
                              toast({ variant: 'destructive', title: 'Invalid amount', description: 'Minimum funding amount is ₦100' });
                              return;
                            }
                            fundWalletMutation.mutate(amount);
                          }}
                          disabled={!fundAmount || parseFloat(fundAmount) < 100 || fundWalletMutation.isPending}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        >
                          {fundWalletMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                          ) : (
                            <>Continue to Payment</>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" disabled={walletBalance < 100 || !bankAccount}>
                        <ArrowUpFromLine className="mr-2 h-5 w-5" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
                      <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                        <DialogDescription>
                          Transfer funds to your bank account
                        </DialogDescription>
                      </DialogHeader>
                      {bankAccount ? (
                        <div className="space-y-4 py-2 sm:py-4">
                          <div className="p-3 sm:p-4 bg-muted rounded-lg">
                            <p className="text-xs sm:text-sm text-muted-foreground">Withdrawing to:</p>
                            <p className="font-medium text-sm sm:text-base">{bankAccount.bankName}</p>
                            <p className="text-xs sm:text-sm break-all">{bankAccount.accountNumber} - {bankAccount.accountName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Amount (₦)</Label>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              min={100}
                              max={walletBalance}
                              className="text-base"
                            />
                            <p className="text-xs text-muted-foreground break-words">
                              Available: ₦{walletBalance.toLocaleString()} | Minimum: ₦100
                            </p>
                          </div>
                          {!pinStatusQuery.data?.hasPin && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle className="text-sm">Transaction PIN Required</AlertTitle>
                              <AlertDescription className="text-xs">
                                You must set a transaction PIN before withdrawing. Please set your PIN in the settings.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="text-sm">No bank account</AlertTitle>
                          <AlertDescription className="text-xs">
                            Please set up your bank account first before withdrawing.
                          </AlertDescription>
                        </Alert>
                      )}
                      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsWithdrawDialogOpen(false);
                            setWithdrawAmount('');
                          }}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleWithdrawAmount} 
                          disabled={!bankAccount || parseFloat(withdrawAmount) < 100 || !pinStatusQuery.data?.hasPin || withdrawMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          Continue
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {!bankAccount && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Set up bank account to withdraw
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{stats.transactionCount || 0}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Total gross: ₦{(stats.totalGross || 0).toLocaleString()}
              </div>
              <div className="pt-4 border-t">
                <Dialog open={isPinSettingsOpen} onOpenChange={setIsPinSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Lock className="mr-2 h-4 w-4" />
                      {pinStatusQuery.data?.hasPin ? 'Update PIN' : 'Set PIN'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{pinStatusQuery.data?.hasPin ? 'Update' : 'Set'} Transaction PIN</DialogTitle>
                      <DialogDescription>
                        {pinStatusQuery.data?.hasPin 
                          ? 'Enter a new 6-digit PIN to update your transaction PIN'
                          : "Set a 6-digit PIN to secure your withdrawals. You'll need this PIN for all withdrawals."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Transaction PIN (6 digits)</Label>
                        <div className="relative">
                          <Input
                            type={showPin ? 'text' : 'password'}
                            placeholder="Enter 6-digit PIN"
                            value={pin}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setPin(value);
                            }}
                            maxLength={6}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPin(!showPin)}
                          >
                            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm PIN</Label>
                        <Input
                          type={showPin ? 'text' : 'password'}
                          placeholder="Confirm 6-digit PIN"
                          value={confirmPin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setConfirmPin(value);
                          }}
                          maxLength={6}
                        />
                      </div>
                      {!pinStatusQuery.data?.hasPin && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            You must set a transaction PIN before you can withdraw funds.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPinSettingsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSetPin} disabled={setPinMutation.isPending || pin.length !== 6 || confirmPin.length !== 6}>
                        {setPinMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting...</>
                        ) : (
                          'Set PIN'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Info */}
        {bankAccount && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-muted">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{bankAccount.bankName}</p>
                  <p className="text-sm text-muted-foreground">
                    {bankAccount.accountNumber} • {bankAccount.accountName}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Virtual Account Info */}
        {bankAccountQuery.data?.virtualAccount && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Virtual Account
              </CardTitle>
              <CardDescription>
                Your Flutterwave virtual account for receiving payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Account Number</p>
                    <Badge variant={bankAccountQuery.data.virtualAccount.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {bankAccountQuery.data.virtualAccount.status || 'ACTIVE'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {bankAccountQuery.data.virtualAccount.accountNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bankAccountQuery.data.virtualAccount.bankName}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>How it works:</strong> Payments from viewing fees are automatically deposited into this virtual account. 
                    You can withdraw funds from your wallet balance to your bank account anytime.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-grid mb-6">
            <TabsTrigger value="earnings" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>All income from viewing fees and commissions</CardDescription>
              </CardHeader>
              <CardContent>
                {earningsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No earnings yet</p>
                    <p className="text-sm text-muted-foreground">
                      Earnings will appear here when users pay viewing fees for your properties.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.map((earning: any) => (
                      <div
                        key={earning._id || earning.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                            <ArrowDownToLine className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">{earning.propertyTitle || 'Viewing Fee'}</p>
                            <p className="text-sm text-muted-foreground">
                              {earning.clientName ? `From ${earning.clientName}` : earning.description || 'Viewing fee payment'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(earning.createdAt), 'PPP p')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            +₦{earning.amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gross: ₦{earning.grossAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>All transfers to your bank account</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawalsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <ArrowUpFromLine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No withdrawals yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your withdrawal history will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((withdrawal: any) => (
                      <div
                        key={withdrawal._id || withdrawal.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <ArrowUpFromLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{withdrawal.bankName}</p>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.accountNumber} • {withdrawal.accountName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(withdrawal.createdAt), 'PPP p')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{withdrawal.amount?.toLocaleString()}</p>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* PIN Verification Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Enter Transaction PIN</DialogTitle>
            <DialogDescription>
              Enter your 6-digit transaction PIN to confirm withdrawal of ₦{pendingWithdrawAmount?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-2">
              <Label className="text-sm">Transaction PIN</Label>
              <div className="relative">
                <Input
                  type={showWithdrawPin ? 'text' : 'password'}
                  placeholder="Enter 6-digit PIN"
                  value={withdrawPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setWithdrawPin(value);
                  }}
                  maxLength={6}
                  className="pr-10 text-base"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowWithdrawPin(!showWithdrawPin)}
                >
                  {showWithdrawPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {pinAttempts < 3 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {pinAttempts} attempt{pinAttempts !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => {
                  setIsPinDialogOpen(false);
                  setIsPinResetDialogOpen(true);
                }}
              >
                Forgot PIN?
              </Button>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPinDialogOpen(false);
                setWithdrawPin('');
                setPendingWithdrawAmount(null);
                setPinAttempts(3);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPin} 
              disabled={withdrawPin.length !== 6 || requestOtpMutation.isPending || pinAttempts === 0}
              className="w-full sm:w-auto"
            >
              {requestOtpMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
              ) : (
                <>Continue</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Enter Withdrawal OTP</DialogTitle>
            <DialogDescription>
              Enter the 6-character OTP sent to your email to confirm withdrawal of ₦{pendingWithdrawAmount?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-2">
              <Label className="text-sm">OTP Code</Label>
              <Input
                type="text"
                placeholder="Enter 6-character OTP"
                value={withdrawOtp}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setWithdrawOtp(value);
                }}
                maxLength={6}
                className="text-base font-mono tracking-widest text-center"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Check your email for the OTP
                </p>
                {otpCountdown > 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Expires in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                  </p>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => requestOtpMutation.mutate()}
                    disabled={requestOtpMutation.isPending}
                  >
                    Resend OTP
                  </Button>
                )}
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Never share this OTP with anyone. House Me will never ask for your OTP via phone or chat.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOtpDialogOpen(false);
                setWithdrawOtp('');
                setPendingWithdrawAmount(null);
                setPendingWithdrawPin('');
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyOtp} 
              disabled={withdrawOtp.length !== 6 || withdrawMutation.isPending || otpCountdown === 0}
              className="w-full sm:w-auto"
            >
              {withdrawMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <>Confirm Withdrawal</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Reset Dialog */}
      <Dialog open={isPinResetDialogOpen} onOpenChange={setIsPinResetDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Reset Transaction PIN</DialogTitle>
            <DialogDescription>
              Request a reset code via email, then enter it along with your new PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            {!resetCodeSent ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A 6-digit reset code will be sent to your email. The code expires in 15 minutes.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => requestPinResetMutation.mutate()}
                  disabled={requestPinResetMutation.isPending}
                  className="w-full"
                >
                  {requestPinResetMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <>Send Reset Code to Email</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Reset Code</Label>
                  <div className="relative">
                    <Input
                      type={showResetCode ? 'text' : 'password'}
                      placeholder="Enter 6-digit reset code"
                      value={resetCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setResetCode(value);
                      }}
                      maxLength={6}
                      className="pr-10 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowResetCode(!showResetCode)}
                    >
                      {showResetCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">New Transaction PIN (6 digits)</Label>
                  <div className="relative">
                    <Input
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter new 6-digit PIN"
                      value={newPinAfterReset}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setNewPinAfterReset(value);
                      }}
                      maxLength={6}
                      className="pr-10 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Confirm New PIN</Label>
                  <Input
                    type={showPin ? 'text' : 'password'}
                    placeholder="Confirm new 6-digit PIN"
                    value={confirmNewPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setConfirmNewPin(value);
                    }}
                    maxLength={6}
                    className="text-base"
                  />
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => {
                    setResetCode('');
                    setNewPinAfterReset('');
                    setConfirmNewPin('');
                    setResetCodeSent(false);
                  }}
                >
                  Request new code
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPinResetDialogOpen(false);
                setResetCode('');
                setNewPinAfterReset('');
                setConfirmNewPin('');
                setResetCodeSent(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {resetCodeSent && (
              <Button 
                onClick={() => {
                  if (!resetCode || resetCode.length !== 6) {
                    toast({ variant: 'destructive', title: 'Invalid code', description: 'Please enter the 6-digit reset code' });
                    return;
                  }
                  if (!newPinAfterReset || newPinAfterReset.length !== 6 || !/^\d{6}$/.test(newPinAfterReset)) {
                    toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be exactly 6 digits' });
                    return;
                  }
                  if (newPinAfterReset !== confirmNewPin) {
                    toast({ variant: 'destructive', title: 'PIN mismatch', description: 'PINs do not match' });
                    return;
                  }
                  resetPinMutation.mutate({ code: resetCode, newPin: newPinAfterReset });
                }}
                disabled={resetPinMutation.isPending || resetCode.length !== 6 || newPinAfterReset.length !== 6 || confirmNewPin.length !== 6}
                className="w-full sm:w-auto"
              >
                {resetPinMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                ) : (
                  <>Reset PIN</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AgentWallet;
