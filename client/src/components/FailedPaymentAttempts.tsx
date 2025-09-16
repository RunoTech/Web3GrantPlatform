import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface PaymentAttempt {
  id: number;
  campaignId: number;
  amount: string;
  currency: string;
  cardBrand: string;
  cardLast4: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  attemptedAt: string;
  processingTime: number;
}

interface FailedPaymentAttemptsProps {
  campaignId: number;
}

export default function FailedPaymentAttempts({ campaignId }: FailedPaymentAttemptsProps) {
  const { data: paymentAttempts, isLoading, error } = useQuery<PaymentAttempt[]>({
    queryKey: ["/api/campaign", campaignId, "payment-attempts"],
  });

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '🔴';
      case 'amex':
      case 'american express':
        return '🔵';
      case 'discover':
        return '🟠';
      default:
        return '💳';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'timeout':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Timeout
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return `${numAmount.toLocaleString()} ${currency}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="card-payment-attempts-loading">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-destructive" />
            <CardTitle>Failed Card Payments</CardTitle>
          </div>
          <CardDescription>
            Loading payment attempt history...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/50" data-testid="card-payment-attempts-error">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle>Failed Card Payments</CardTitle>
          </div>
          <CardDescription>
            Failed to load payment attempt history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <p className="text-sm text-muted-foreground">
              Unable to load failed payment attempts. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentAttempts || paymentAttempts.length === 0) {
    return (
      <Card className="w-full" data-testid="card-payment-attempts-empty">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Failed Card Payments</CardTitle>
          </div>
          <CardDescription>
            Monitor failed credit card payment attempts for your campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground">No Failed Payments</p>
            <p className="text-xs text-muted-foreground mt-1">
              All credit card payments have been processed successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="card-payment-attempts">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-destructive" />
          <CardTitle>Failed Card Payments</CardTitle>
          <Badge variant="secondary" data-testid="badge-attempt-count">
            {paymentAttempts.length}
          </Badge>
        </div>
        <CardDescription>
          Monitor and track failed credit card payment attempts for your campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead data-testid="header-date">Date</TableHead>
                <TableHead data-testid="header-amount">Amount</TableHead>
                <TableHead data-testid="header-card">Card</TableHead>
                <TableHead data-testid="header-status">Status</TableHead>
                <TableHead data-testid="header-error">Error</TableHead>
                <TableHead className="text-right" data-testid="header-processing-time">Processing Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentAttempts.map((attempt) => (
                <TableRow key={attempt.id} data-testid={`row-payment-attempt-${attempt.id}`}>
                  <TableCell className="font-medium" data-testid={`date-${attempt.id}`}>
                    {formatDate(attempt.attemptedAt)}
                  </TableCell>
                  <TableCell data-testid={`amount-${attempt.id}`}>
                    <span className="font-semibold">
                      {formatAmount(attempt.amount, attempt.currency)}
                    </span>
                  </TableCell>
                  <TableCell data-testid={`card-${attempt.id}`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCardBrandIcon(attempt.cardBrand)}</span>
                      <div>
                        <p className="font-medium text-sm capitalize">{attempt.cardBrand}</p>
                        <p className="text-xs text-muted-foreground">•••• {attempt.cardLast4}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`status-${attempt.id}`}>
                    {getStatusBadge(attempt.status)}
                  </TableCell>
                  <TableCell data-testid={`error-${attempt.id}`}>
                    <div className="max-w-xs">
                      <p className="font-mono text-xs text-muted-foreground mb-1">
                        {attempt.errorCode}
                      </p>
                      <p className="text-sm text-foreground truncate" title={attempt.errorMessage}>
                        {attempt.errorMessage}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" data-testid={`processing-time-${attempt.id}`}>
                    <span className="text-sm text-muted-foreground">
                      {attempt.processingTime}ms
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}