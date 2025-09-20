import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import HeroSection from "@/components/hero";
import StatsSection from "@/components/stats-section";
import HowItWorksSection from "@/components/how-it-works-section";
// import TestimonialsSection from "@/components/testimonials-section";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { getUsersFeedback } from "@/actions/dashboard";

export default async function LandingPage() {
  const { feedbacks } = await getUsersFeedback();

  return (
    <>
      <div className="grid-background"></div>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[1200px]">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-8 sm:mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Powerful Features for Your Career Growth
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[1100px] mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-card border border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardContent className="p-4 sm:p-6 text-center flex flex-col items-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-primary mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-br from-secondary via-card to-secondary">
        <div className="container mx-auto px-4 sm:px-6 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[1200px]">
          <StatsSection />
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Testimonials Section
      <TestimonialsSection testimonials={testimonial} feedbacks={feedbacks} /> */}

      {/* FAQ Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-br from-secondary via-card to-secondary">
        <div className="container mx-auto px-4 sm:px-6 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[1200px]">
          <div className="text-center max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[800px] mx-auto mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[800px] mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border">
                  <AccordionTrigger className="text-left text-sm sm:text-base text-foreground hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-background py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[1200px] bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-2xl p-8 sm:p-12 border border-primary/20">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ready to Accelerate Your Career?
            </h2>
            <p className="mx-auto max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[600px] text-sm sm:text-base md:text-lg text-muted-foreground">
              Join thousands of professionals who are advancing their careers
              with AI-powered guidance.
            </p>
            <Link href="/" passHref>
              <Button
                size="lg"
                className="h-10 sm:h-11 mt-4 sm:mt-5 bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse text-sm sm:text-base">
                Start Your Journey Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
