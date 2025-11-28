import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  TrendingDown,
  TrendingUp,
  Euro,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  FileText,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface InsuranceOffer {
  product_code: string;
  product_name: string;
  premium_type: "CRD" | "FIXE";
  premium_type_label?: string;
  monthly_premium: number;
  total_cost: number;
  taea_percent: number;
  coverages_included?: string[];
  is_best?: boolean;
}

export interface QuoteCardProps {
  offer: InsuranceOffer;
  loanAmount?: number;
  loanDurationMonths?: number;
  onSubscribe?: (offer: InsuranceOffer) => void;
  onDownloadPdf?: (offer: InsuranceOffer) => void;
  isSubscribing?: boolean;
  className?: string;
}

const COVERAGE_LABELS: Record<string, string> = {
  DCPTIA: "Décès/PTIA",
  IPT: "IPT",
  IPP: "IPP",
  ITT: "ITT",
};

export function QuoteCard({
  offer,
  loanAmount,
  loanDurationMonths,
  onSubscribe,
  onDownloadPdf,
  isSubscribing = false,
  className,
}: QuoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const premiumTypeInfo = offer.premium_type === "CRD"
    ? {
        icon: TrendingDown,
        label: "Cotisation dégressive",
        description: "Diminue avec le capital restant dû",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      }
    : {
        icon: TrendingUp,
        label: "Cotisation constante",
        description: "Reste identique pendant toute la durée",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };

  const PremiumIcon = premiumTypeInfo.icon;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        offer.is_best && "ring-2 ring-amber-400 shadow-lg",
        isHovered && "shadow-xl scale-[1.02]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Best Offer Badge */}
      {offer.is_best && (
        <div className="absolute -top-1 -right-1 z-10">
          <Badge className="bg-amber-500 text-white gap-1 px-3 py-1">
            <Star className="h-3 w-3 fill-current" />
            Meilleure offre
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              {offer.product_name}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">{offer.product_code}</p>
          </div>
          <div className={cn("p-2 rounded-lg", premiumTypeInfo.bgColor)}>
            <PremiumIcon className={cn("h-5 w-5", premiumTypeInfo.color)} />
          </div>
        </div>

        {/* Premium Type Badge */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mt-2",
          premiumTypeInfo.bgColor,
          premiumTypeInfo.borderColor,
          "border"
        )}>
          <span className={cn("font-medium", premiumTypeInfo.color)}>
            {premiumTypeInfo.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Mensualité</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {offer.monthly_premium.toFixed(2)}
              </span>
              <span className="text-slate-500">euros/mois</span>
            </div>
            {offer.premium_type === "CRD" && (
              <p className="text-xs text-slate-400">(initiale)</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Coût total</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {offer.total_cost.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500">euros</span>
            </div>
          </div>
        </div>

        {/* TAEA */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
          <span className="text-sm text-slate-600">TAEA</span>
          <span className="text-lg font-semibold text-slate-900">
            {offer.taea_percent.toFixed(2)}%
          </span>
        </div>

        {/* Coverages */}
        {offer.coverages_included && offer.coverages_included.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Garanties incluses</p>
              <div className="flex flex-wrap gap-2">
                {offer.coverages_included.map((coverage) => (
                  <Badge
                    key={coverage}
                    variant="secondary"
                    className="gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {COVERAGE_LABELS[coverage] || coverage}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Loan Info */}
        {(loanAmount || loanDurationMonths) && (
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            {loanAmount && (
              <div className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                <span>{loanAmount.toLocaleString('fr-FR')} euros</span>
              </div>
            )}
            {loanDurationMonths && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{Math.round(loanDurationMonths / 12)} ans</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {onDownloadPdf && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onDownloadPdf(offer)}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        )}
        {onSubscribe && (
          <Button
            size="sm"
            className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onSubscribe(offer)}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Souscrire
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Composant pour afficher plusieurs offres côte à côte
 */
export interface QuoteComparisonProps {
  offers: InsuranceOffer[];
  loanAmount?: number;
  loanDurationMonths?: number;
  onSubscribe?: (offer: InsuranceOffer) => void;
  onDownloadPdf?: (offer: InsuranceOffer) => void;
  isSubscribing?: boolean;
  title?: string;
}

export function QuoteComparison({
  offers,
  loanAmount,
  loanDurationMonths,
  onSubscribe,
  onDownloadPdf,
  isSubscribing,
  title = "Offres disponibles",
}: QuoteComparisonProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Aucune offre disponible pour ce profil.
      </div>
    );
  }

  // Marquer la meilleure offre
  const sortedOffers = [...offers].sort((a, b) => a.total_cost - b.total_cost);
  const offersWithBest = sortedOffers.map((offer, index) => ({
    ...offer,
    is_best: index === 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offersWithBest.map((offer) => (
          <QuoteCard
            key={`${offer.product_code}-${offer.premium_type}`}
            offer={offer}
            loanAmount={loanAmount}
            loanDurationMonths={loanDurationMonths}
            onSubscribe={onSubscribe}
            onDownloadPdf={onDownloadPdf}
            isSubscribing={isSubscribing}
          />
        ))}
      </div>

      {/* Savings comparison */}
      {offers.length >= 2 && (
        <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingDown className="h-5 w-5" />
            <span className="font-medium">
              Économie potentielle : {(sortedOffers[sortedOffers.length - 1].total_cost - sortedOffers[0].total_cost).toLocaleString('fr-FR')} euros
            </span>
          </div>
          <p className="text-sm text-emerald-600 mt-1">
            En choisissant la meilleure offre sur la durée totale du prêt
          </p>
        </div>
      )}
    </div>
  );
}
