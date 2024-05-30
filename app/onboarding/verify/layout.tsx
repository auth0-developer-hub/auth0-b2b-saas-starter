export default async function VerifyLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <main className="flex min-h-screen items-center">{children}</main>
}
