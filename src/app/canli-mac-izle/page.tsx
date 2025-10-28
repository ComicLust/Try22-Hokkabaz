import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveMatchClient from "@/components/LiveMatchClient";
import SeoArticle from "@/components/SeoArticle";
import InAppOpenBar from "@/components/InAppOpenBar";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/canli-mac-izle" />
      <InAppOpenBar />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gold mb-4">Canlı Maç İzle</h1>
          <p className="text-muted-foreground mb-6">Derbi ve özel maç yayınlarını bu sayfadan takip edebilir, sponsorlarımızın kampanyalarına göz atabilirsiniz.</p>
          <LiveMatchClient />
        </div>
      </main>
      <SeoArticle slug="canli-mac-izle" />
      <Footer />
    </div>
  );
}