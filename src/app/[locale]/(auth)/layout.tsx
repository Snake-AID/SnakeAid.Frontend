import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  redirect(`/${locale}/login`);
}
