'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { getInitials, formatFullDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  const fields = [
    { icon: User,     label: 'Username', value: user.username },
    { icon: Mail,     label: 'Email',    value: user.email },
    { icon: Shield,   label: 'Role',     value: user.role ?? 'user' },
    { icon: Calendar, label: 'Joined',   value: user.createdAt ? formatFullDate(user.createdAt) : '—' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">Profile</h1>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.username}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium capitalize">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={logout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}
