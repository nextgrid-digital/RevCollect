import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, description, className }: StatCardProps) {
  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader className='pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-semibold tabular-nums'>{value}</p>
        {description ? <p className='text-muted-foreground mt-1 text-xs'>{description}</p> : null}
      </CardContent>
    </Card>
  );
}
