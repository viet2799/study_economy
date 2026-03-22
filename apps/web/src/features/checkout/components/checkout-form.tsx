'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { checkoutFormSchema, type CheckoutFormValues } from '../../../shared/schemas/checkout';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';

type Props = {
  onSubmit: (values: CheckoutFormValues) => void | Promise<void>;
};

export function CheckoutForm({ onSubmit }: Props) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: 'demo@studybase.local',
      paymentMethod: 'cod',
      notes: '',
      address: {
        fullName: 'Demo User',
        phone: '0900000000',
        line1: '123 Nguyen Trai',
        line2: '',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        postalCode: '700000'
      }
    }
  });

  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Checkout</p>
          <h3 className="text-xl font-semibold text-slate-950">Address & payment</h3>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...form.register('address.fullName')} />
            {form.formState.errors.address?.fullName ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.address.fullName.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register('address.phone')} />
              {form.formState.errors.address?.phone ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.address.phone.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-rose-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="line1">Address</Label>
            <Input id="line1" {...form.register('address.line1')} />
            {form.formState.errors.address?.line1 ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.address.line1.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-2">
              <Input placeholder="Ward" {...form.register('address.ward')} />
              {form.formState.errors.address?.ward ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.address.ward.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Input placeholder="District" {...form.register('address.district')} />
              {form.formState.errors.address?.district ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.address.district.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Input placeholder="City" {...form.register('address.city')} />
              {form.formState.errors.address?.city ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.address.city.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Delivery notes" {...form.register('notes')} />
          </div>
          <Button loading={form.formState.isSubmitting} type="submit">
            Place order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
