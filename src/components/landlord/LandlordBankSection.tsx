import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  CreditCard,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatPriceNgn } from '@/lib/format';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';

type LandlordBankSectionProps = {
  userId?: string;
  enabled?: boolean;
  walletPath?: string;
};

export function LandlordBankSection({
  userId,
  enabled = true,
  walletPath = '/landlord/wallet',
}: LandlordBankSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBankSettingsOpen, setIsBankSettingsOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
  });

  const bankAccountQuery = useQuery({
    queryKey: ['bank-account', userId],
    queryFn: () => api.agents.getBankAccount(),
    enabled: enabled && Boolean(userId),
  });

  const updateBankAccountMutation = useMutation({
    mutationFn: (bankAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      bankCode: string;
    }) => api.agents.updateBankAccount(bankAccount),
    onSuccess: () => {
      toast({
        title: 'Bank account updated',
        description: 'Your bank account details have been saved successfully.',
      });
      setIsBankSettingsOpen(false);
      bankAccountQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update bank account',
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (bankAccountQuery.data?.bankAccount) {
      setBankForm({
        bankName: bankAccountQuery.data.bankAccount.bankName || '',
        accountNumber: bankAccountQuery.data.bankAccount.accountNumber || '',
        accountName: bankAccountQuery.data.bankAccount.accountName || '',
        bankCode: bankAccountQuery.data.bankAccount.bankCode || '',
      });
    }
  }, [bankAccountQuery.data]);

  const walletBalance = bankAccountQuery.data?.walletBalance;

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Account Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your bank account to receive payments from inspection fees
              </p>
            </div>
            <Dialog open={isBankSettingsOpen} onOpenChange={setIsBankSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  {bankAccountQuery.data?.bankAccount ? 'Update Account' : 'Add Bank Account'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bank Account Details</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      !bankForm.bankName ||
                      !bankForm.accountNumber ||
                      !bankForm.accountName ||
                      !bankForm.bankCode
                    ) {
                      toast({
                        variant: 'destructive',
                        title: 'Validation Error',
                        description: 'Please fill in all fields',
                      });
                      return;
                    }
                    updateBankAccountMutation.mutate(bankForm);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Popover open={bankOpen} onOpenChange={setBankOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bankOpen}
                          className="w-full justify-between"
                        >
                          {bankForm.bankName || 'Select bank...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search bank..." />
                          <CommandList className="max-h-[200px] sm:max-h-[300px]">
                            <CommandEmpty>No bank found.</CommandEmpty>
                            <CommandGroup>
                              {NIGERIAN_BANKS.map((bank) => (
                                <CommandItem
                                  key={bank.code}
                                  value={bank.name}
                                  onSelect={() => {
                                    setBankForm((prev) => ({
                                      ...prev,
                                      bankName: bank.name,
                                      bankCode: bank.code,
                                    }));
                                    setBankOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      bankForm.bankName === bank.name ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  {bank.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter 10-digit account number"
                      value={bankForm.accountNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setBankForm((prev) => ({ ...prev, accountNumber: value }));
                      }}
                      required
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your 10-digit bank account number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="Enter account name (as it appears on your bank statement)"
                      value={bankForm.accountName}
                      onChange={(e) =>
                        setBankForm((prev) => ({ ...prev, accountName: e.target.value }))
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This should match the name on your bank account
                    </p>
                  </div>

                  {walletBalance !== undefined && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Wallet Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatPriceNgn(walletBalance)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available for withdrawal to your bank account
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBankSettingsOpen(false)}
                      disabled={updateBankAccountMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateBankAccountMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateBankAccountMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Bank Account'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {bankAccountQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : bankAccountQuery.data?.bankAccount ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {bankAccountQuery.data.bankAccount.bankName}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {bankAccountQuery.data.bankAccount.accountNumber}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {bankAccountQuery.data.bankAccount.accountName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBankSettingsOpen(true)}
                  className="w-full sm:w-auto shrink-0"
                >
                  Edit
                </Button>
              </div>
              {walletBalance !== undefined && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Available Balance</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatPriceNgn(walletBalance)}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(walletPath)}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      View Wallet
                    </Button>
                    {walletBalance > 0 && (
                      <Button className="flex-1" size="sm" onClick={() => navigate(walletPath)}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No bank account configured</p>
              <Button onClick={() => setIsBankSettingsOpen(true)}>Add Bank Account</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {bankAccountQuery.data?.virtualAccount && (
        <Card className="mb-6">
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
                  <Badge
                    variant={
                      bankAccountQuery.data.virtualAccount.status === 'ACTIVE'
                        ? 'default'
                        : 'secondary'
                    }
                  >
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
                  <strong>How it works:</strong> Payments from inspection fees are automatically
                  deposited into this virtual account. You can withdraw funds from your wallet
                  balance to your bank account anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
