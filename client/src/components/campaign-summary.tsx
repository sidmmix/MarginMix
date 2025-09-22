import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Target, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin,
  Briefcase,
  User,
  TrendingUp,
  CheckCircle,
  IndianRupee,
  Percent,
  Book
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  formatBudget, 
  formatPlatforms, 
  formatProduct, 
  formatObjective, 
  formatAudience, 
  formatTimeframe, 
  formatSeasonal,
  formatText
} from "@/lib/format-utils";

interface CampaignSummaryProps {
  sessionData: Record<string, any>;
  onContinue: () => void;
}

export function CampaignSummary({ sessionData, onContinue }: CampaignSummaryProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingBenchmarks, setIsGeneratingBenchmarks] = useState(false);
  const [isGeneratingMediaMix, setIsGeneratingMediaMix] = useState(false);
  const [isGeneratingPlaybook, setIsGeneratingPlaybook] = useState(false);


  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('campaign-summary-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add company name to filename if available
      const companyName = sessionData.company || 'Campaign';
      const fileName = `${companyName.replace(/[^a-z0-9]/gi, '_')}_Campaign_Brief.pdf`;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generateBenchmarks = async () => {
    setIsGeneratingBenchmarks(true);
    try {
      // Placeholder functionality - implement actual benchmarks generation
      setTimeout(() => {
        alert("Cost Efficiency Benchmarks feature coming soon!");
        setIsGeneratingBenchmarks(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating benchmarks:', error);
      setIsGeneratingBenchmarks(false);
    }
  };

  const generateMediaMix = async () => {
    setIsGeneratingMediaMix(true);
    try {
      // Placeholder functionality - implement actual media mix generation
      setTimeout(() => {
        alert("Suggestive Inventory Level Media Mix feature coming soon!");
        setIsGeneratingMediaMix(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating media mix:', error);
      setIsGeneratingMediaMix(false);
    }
  };

  const generatePlaybook = async () => {
    setIsGeneratingPlaybook(true);
    try {
      // Placeholder functionality - implement actual activation playbook generation
      setTimeout(() => {
        alert("Generate Activation Playbook feature coming soon!");
        setIsGeneratingPlaybook(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating playbook:', error);
      setIsGeneratingPlaybook(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Your Campaign Brief is Ready!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A comprehensive digital media strategy tailored to your campaign objectives
            </p>
          </div>
        </div>
      </div>

      <div id="campaign-summary-content" className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">
              Digital Media Campaign Brief{sessionData.company ? ` for ${sessionData.company}` : ''}
            </h2>
            <div className="flex items-center justify-center gap-3 text-blue-100 mb-2">
              <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
              <span className="text-lg">Generated by YourBrief AI Media Strategist</span>
              <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
            </div>
            <div className="text-blue-200">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Basic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionData.name && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">POC:</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{sessionData.name}</p>
                </div>
              )}
              
              {sessionData.company && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Company:</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{sessionData.company}</p>
                </div>
              )}

              {sessionData.objective && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Objective:</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{formatObjective(sessionData.objective)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product/Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                Product/Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {formatProduct(sessionData.product)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Target Audience and Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {formatAudience(sessionData.audience)}
              </p>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData.budget && (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{formatBudget(sessionData.budget)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Timeframe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Timeframe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {formatTimeframe(sessionData.timeframe)}
              </p>
            </CardContent>
          </Card>

          {/* Season */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pink-600" />
                Season
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {formatSeasonal(sessionData.season)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platforms */}
        {sessionData.platforms && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Selected Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formatPlatforms(sessionData.platforms).split(", ").map((platform, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {platform}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Next Steps */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Next Steps
          </h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your campaign brief has been created! To access advanced features including:
            </p>
            <ul className="text-left text-gray-700 dark:text-gray-300 space-y-2 mb-4 max-w-md mx-auto">
              <li>• Live reach and frequency forecasting</li>
              <li>• Budget optimization recommendations</li>
              <li>• Platform-specific setup guides</li>
              <li>• Real-time campaign tracking</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Sign in to continue with the full YourBrief platform.
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-4 justify-center items-center">
        <Button 
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          {isGeneratingPDF ? "Generating Brief..." : "Download Brief"}
        </Button>
        
        <Button 
          onClick={generateBenchmarks}
          disabled={isGeneratingBenchmarks}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <IndianRupee className="h-4 w-4" />
          </div>
          {isGeneratingBenchmarks ? "Generating..." : "Generate Cost Efficiency Benchmarks"}
        </Button>
        
        <Button 
          onClick={generateMediaMix}
          disabled={isGeneratingMediaMix}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <Percent className="h-5 w-5" />
          {isGeneratingMediaMix ? "Generating..." : "Suggestive Inventory Level Media Mix"}
        </Button>
        
        <Button 
          onClick={generatePlaybook}
          disabled={isGeneratingPlaybook}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <Book className="h-5 w-5" />
          {isGeneratingPlaybook ? "Generating..." : "Generate Activation Playbook"}
        </Button>
      </div>
    </div>
  );
}