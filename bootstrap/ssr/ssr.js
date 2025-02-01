import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link, Head, useForm, usePage, router, createInertiaApp } from "@inertiajs/react";
import * as React from "react";
import React__default, { forwardRef, useRef, useImperativeHandle, useEffect, useState, createContext, useContext, useCallback } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDown, X, Menu, ExternalLink, Twitter, Globe, Linkedin, Github, Mail, ArrowRight, HandMetal, FileDown, Briefcase, Infinity as Infinity$1, Lightbulb, Users, Zap, Heart, MessageCircle, Award, Calendar, Check, ChevronsUpDown, Plus, Send, Code2, Cloud, Star, ChevronLeft, ChevronRight, Grid, MessageSquare, Code, Server, Lock, ArrowRightLeft, Brain, Database, MonitorSmartphone, GitBranch, Repeat, CheckCircle, BarChart, Landmark, Stethoscope, ShoppingCart, GraduationCap, Factory, Film, Shield, Bell, Gauge, AlertTriangle, FileSearch, Eye } from "lucide-react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Toaster, toast } from "sonner";
import confetti from "canvas-confetti";
import { Transition, Dialog, TransitionChild, DialogPanel } from "@headlessui/react";
import useEmblaCarousel from "embla-carousel-react";
import require$$0 from "process";
import require$$1 from "http";
import { renderToString } from "react-dom/server";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  NavigationMenuPrimitive.Root,
  {
    ref,
    className: cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(NavigationMenuViewport, {})
    ]
  }
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;
const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  NavigationMenuPrimitive.List,
  {
    ref,
    className: cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    ),
    ...props
  }
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;
const NavigationMenuItem = NavigationMenuPrimitive.Item;
const navigationMenuTriggerStyle = "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50";
const NavigationMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  NavigationMenuPrimitive.Trigger,
  {
    ref,
    className: cn(navigationMenuTriggerStyle, "group", className),
    ...props,
    children: [
      children,
      " ",
      /* @__PURE__ */ jsx(
        ChevronDown,
        {
          className: "relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180",
          "aria-hidden": "true"
        }
      )
    ]
  }
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;
const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  NavigationMenuPrimitive.Content,
  {
    ref,
    className: cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    ),
    ...props
  }
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;
const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: cn("absolute left-0 top-full flex justify-center"), children: /* @__PURE__ */ jsx(
  NavigationMenuPrimitive.Viewport,
  {
    className: cn(
      "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
      className
    ),
    ref,
    ...props
  }
) }));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;
const NavigationMenuIndicator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  NavigationMenuPrimitive.Indicator,
  {
    ref,
    className: cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: "relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" })
  }
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;
function Logo({ className }) {
  return /* @__PURE__ */ jsx(Link, { href: "/", className: cn("flex items-center justify-center", className), children: /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center transform hover:scale-105 transition-transform duration-200", children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-white", children: "h" }) }) });
}
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
const menuItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Blog", href: "https://blog.harun.dev", external: true },
  { name: "Book a Session", href: "/book" },
  { name: "Contact", href: "/contact" }
];
function Menubar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const renderMenuItem = (item) => {
    const content = /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("span", { className: "relative z-10 flex items-center gap-1", children: [
        item.name,
        item.external && /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" })
      ] }),
      item.name === "Book a Session" && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" })
    ] });
    if (item.external) {
      return /* @__PURE__ */ jsx(
        "a",
        {
          href: item.href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: cn(
            navigationMenuTriggerStyle,
            "text-white transition-all duration-300 cursor-pointer no-underline",
            "bg-transparent hover:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-gradient-to-r after:from-[#6EE7B7] after:to-transparent after:transition-transform after:duration-300"
          ),
          children: content
        }
      );
    }
    return /* @__PURE__ */ jsx(
      Link,
      {
        href: item.href,
        className: cn(
          navigationMenuTriggerStyle,
          "text-white transition-all duration-300 cursor-pointer no-underline",
          item.name === "Book a Session" ? "!bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white transition-all duration-300 relative overflow-hidden group" : "bg-transparent hover:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-gradient-to-r after:from-[#6EE7B7] after:to-transparent after:transition-transform after:duration-300"
        ),
        children: content
      }
    );
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-gradient-to-r from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6] shadow-lg backdrop-blur-sm bg-opacity-95" : "bg-transparent"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx(Logo, { className: "cursor-pointer" }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsx(NavigationMenu, { children: /* @__PURE__ */ jsx(NavigationMenuList, { children: menuItems.map((item) => /* @__PURE__ */ jsx(NavigationMenuItem, { children: renderMenuItem(item) }, item.name)) }) }) }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden", children: /* @__PURE__ */ jsxs(Sheet, { children: [
          /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { className: "text-white cursor-pointer", children: /* @__PURE__ */ jsx(Menu, { size: 24 }) }) }),
          /* @__PURE__ */ jsx(SheetContent, { side: "right", className: "w-[300px] sm:w-[400px] bg-[#7C3AED]", children: /* @__PURE__ */ jsx("nav", { className: "flex flex-col gap-4", children: menuItems.map((item) => item.external ? /* @__PURE__ */ jsxs(
            "a",
            {
              href: item.href,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-white text-lg py-2 px-4 rounded-md transition-all duration-300 hover:cursor-pointer no-underline hover:bg-white/10 flex items-center gap-1",
              children: [
                item.name,
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" })
              ]
            },
            item.name
          ) : /* @__PURE__ */ jsxs(
            Link,
            {
              href: item.href,
              className: cn(
                "text-white text-lg py-2 px-4 rounded-md transition-all duration-300 hover:cursor-pointer no-underline",
                item.name === "Book a Session" ? "!bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white relative overflow-hidden group" : "hover:bg-white/10"
              ),
              children: [
                item.name,
                item.name === "Book a Session" && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" })
              ]
            },
            item.name
          )) }) })
        ] }) })
      ] })
    }
  );
}
const Icons = {
  twitter: Twitter,
  globe: Globe,
  linkedin: Linkedin,
  github: Github,
  mail: Mail
};
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "relative", children: /* @__PURE__ */ jsxs("div", { className: "relative bg-gradient-to-r from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 -top-16", children: /* @__PURE__ */ jsx("div", { className: "relative z-10 mx-auto max-w-7xl px-4", children: /* @__PURE__ */ jsx("div", { className: "bg-[#1a1a2e] rounded-[24px] shadow-2xl", children: /* @__PURE__ */ jsx("div", { className: "px-8 py-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-white", children: "Ready to level up?" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "Let's build something extraordinary together" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ jsx(Link, { href: "/portfolio", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            className: "relative group bg-transparent text-white hover:text-white hover:bg-white/10 border-white/20 font-medium px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300",
            children: [
              "View Portfolio",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(
          Button,
          {
            className: "relative group bg-[#6EE7B7] hover:bg-[#6EE7B7]/90 text-[#1a1a2e] font-medium px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300",
            children: [
              /* @__PURE__ */ jsx(HandMetal, { className: "w-4 h-4 group-hover:rotate-12 transition-transform duration-300" }),
              "Start a Project"
            ]
          }
        ) })
      ] })
    ] }) }) }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 pt-32 pb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.5 },
            className: "text-center space-y-8 mb-16",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
                /* @__PURE__ */ jsx(Logo, { className: "w-20 h-20 relative z-10" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/10 rounded-full blur-xl transform scale-150" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-white", children: "Building the Future" }),
                /* @__PURE__ */ jsx("p", { className: "text-xl text-white/90 max-w-xl mx-auto font-light", children: "Crafting scalable solutions and empowering teams through DevOps excellence and cloud innovation." })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.5, delay: 0.1 },
            className: "grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 w-full max-w-4xl",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-white font-semibold mb-4", children: "Services" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/services/cloud", className: "text-white/80 hover:text-white transition-colors", children: "Cloud Solutions" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/services/devops", className: "text-white/80 hover:text-white transition-colors", children: "DevOps" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/services/architecture", className: "text-white/80 hover:text-white transition-colors", children: "Architecture" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-white font-semibold mb-4", children: "Resources" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/blog", className: "text-white/80 hover:text-white transition-colors", children: "Blog" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/case-studies", className: "text-white/80 hover:text-white transition-colors", children: "Case Studies" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/tutorials", className: "text-white/80 hover:text-white transition-colors", children: "Tutorials" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-white font-semibold mb-4", children: "Company" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/about", className: "text-white/80 hover:text-white transition-colors", children: "About" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/contact", className: "text-white/80 hover:text-white transition-colors", children: "Contact" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/careers", className: "text-white/80 hover:text-white transition-colors", children: "Careers" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-white font-semibold mb-4", children: "Legal" }),
                /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/privacy", className: "text-white/80 hover:text-white transition-colors", children: "Privacy" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/terms", className: "text-white/80 hover:text-white transition-colors", children: "Terms" }) }),
                  /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/cookies", className: "text-white/80 hover:text-white transition-colors", children: "Cookies" }) })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.5, delay: 0.2 },
            className: "flex flex-wrap justify-center gap-6 mb-16",
            children: [
              { href: "#", icon: Icons.twitter, label: "Twitter" },
              { href: "#", icon: Icons.linkedin, label: "LinkedIn" },
              { href: "#", icon: Icons.github, label: "GitHub" },
              { href: "mailto:hello@harun.dev", icon: Icons.mail, label: "Email" }
            ].map((social, index) => /* @__PURE__ */ jsxs(
              motion.a,
              {
                href: social.href,
                className: "w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-300 group relative overflow-hidden",
                whileHover: { scale: 1.1, rotate: 5 },
                whileTap: { scale: 0.9 },
                "aria-label": social.label,
                children: [
                  social.icon && /* @__PURE__ */ jsx(social.icon, { className: "w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" }),
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[#6EE7B7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" })
                ]
              },
              social.label
            ))
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.5, delay: 0.3 },
            className: "text-center space-y-4",
            children: [
              /* @__PURE__ */ jsx("p", { className: "text-white/90 text-lg font-light", children: "Living, learning, & leveling up one day at a time." }),
              /* @__PURE__ */ jsxs("p", { className: "text-white/80 text-sm", children: [
                "Handcrafted with ❤️ by Harun © ",
                (/* @__PURE__ */ new Date()).getFullYear()
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6EE7B7]/10 rounded-full blur-3xl opacity-50" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#86D2F1]/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[250px] h-[250px] bg-[#8B5CF6]/10 rounded-full blur-3xl" })
      ] })
    ] })
  ] }) });
}
class ErrorBoundary extends React__default.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-4", children: "Something went wrong" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => this.setState({ hasError: false }),
            className: "px-4 py-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors",
            children: "Try again"
          }
        )
      ] }) });
    }
    return this.props.children;
  }
}
function AboutHero() {
  return /* @__PURE__ */ jsxs("section", { className: "relative py-20 overflow-hidden bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: [
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8 },
          children: [
            /* @__PURE__ */ jsx("h1", { className: "text-4xl lg:text-5xl font-bold mb-6 text-white", children: "About" }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0", children: "With over 17 years of experience in software engineering, cloud architecture, and DevOps, I've dedicated my career to building scalable solutions and empowering teams through innovation and best practices." }),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.2 },
                children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "default",
                    size: "lg",
                    className: "bg-white text-[#7C3AED] hover:bg-white/90 transition-all duration-300 group",
                    onClick: () => window.open("/cv-harun-r-rayhan.pdf", "_blank"),
                    children: [
                      /* @__PURE__ */ jsx(FileDown, { className: "mr-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform duration-300" }),
                      "Download CV"
                    ]
                  }
                )
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "lg:w-1/2",
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.8 },
          children: /* @__PURE__ */ jsx("div", { className: "relative mx-auto", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1724510563675-2-HGUREtjVmDqynr0x56IlMU0yIJtex3.jpeg",
              alt: "Harun R. Rayhan - Software Engineer and Cloud Architect",
              className: "w-80 h-80 rounded-full shadow-2xl border-4 border-white/20 object-cover",
              loading: "eager"
            }
          ) })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" })
  ] });
}
const timelineEvents = [
  {
    year: "2023",
    title: "Senior Cloud DevOps Engineer",
    company: "South River Mortgage",
    location: "Annapolis, Maryland, USA (Remote)",
    description: "Modernized infrastructure to AWS cloud, reducing expenses by 30% and improving page speed from 50% to 90%.",
    icon: Briefcase
  },
  {
    year: "2021",
    title: "Senior Software Engineer",
    company: "SocialHP inc.",
    location: "Toronto, Canada (Remote)",
    description: "Engineered AWS and Google Cloud infrastructure with 99.9% uptime, reducing scaling costs by 35% and improving deployment frequency by 30%.",
    icon: Briefcase
  },
  {
    year: "2020",
    title: "Lead Software Engineer",
    company: "Trinax Singapore",
    location: "Singapore (Remote)",
    description: "Led backend team in deploying AWS cloud infrastructures, supporting high-traffic applications with 99.9% uptime for multinational corporations.",
    icon: Briefcase
  },
  {
    year: "2018",
    title: "Software Engineer",
    company: "United Innovations Pty Ltd",
    location: "Australia (Remote)",
    description: "Built scalable infrastructure on AWS Cloud serving millions of requests with sub-100ms response times.",
    icon: Briefcase
  }
];
function JourneyTimeline() {
  return /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsx(
      motion.h2,
      {
        className: "text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900",
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        children: "My Professional Journey"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]" }),
      timelineEvents.map((event, index) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: `flex items-center mb-8 ${index % 2 === 0 ? "flex-row-reverse" : ""}`,
          initial: { opacity: 0, x: index % 2 === 0 ? 50 : -50 },
          whileInView: { opacity: 1, x: 0 },
          viewport: { once: true },
          transition: { duration: 0.8, delay: index * 0.2 },
          children: [
            /* @__PURE__ */ jsxs("div", { className: `w-1/2 ${index % 2 === 0 ? "text-right pr-8" : "pl-8"}`, children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-1", children: event.title }),
              /* @__PURE__ */ jsx("p", { className: "text-[#7C3AED] font-medium mb-2", children: event.company }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-2", children: event.location }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: event.description })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-[#86D2F1] to-[#7C3AED] flex items-center justify-center z-10", children: /* @__PURE__ */ jsx(event.icon, { className: "w-6 h-6 text-white" }) }),
            /* @__PURE__ */ jsx("div", { className: `w-1/2 ${index % 2 === 0 ? "pl-8" : "text-right pr-8"}`, children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-[#7C3AED]", children: event.year }) })
          ]
        },
        index
      ))
    ] })
  ] }) });
}
const skills$1 = [
  {
    name: "AWS",
    logo: "/images/skills/aws.svg",
    isHot: true
  },
  {
    name: "DevOps",
    isIcon: true,
    icon: Infinity$1,
    isHot: true
  },
  {
    name: "Terraform",
    logo: "/images/skills/terraform.svg",
    isHot: true
  },
  {
    name: "Kubernetes",
    logo: "/images/skills/kubernetes.svg"
  },
  {
    name: "Docker",
    logo: "/images/skills/docker.png"
  },
  {
    name: "Python",
    logo: "/images/skills/python.png"
  },
  {
    name: "Serverless",
    logo: "/images/skills/serverless.png",
    isHot: true
  },
  {
    name: "Go",
    logo: "/images/skills/go.svg"
  },
  {
    name: "Jenkins",
    logo: "/images/skills/jenkins.svg"
  },
  {
    name: "Node.js",
    logo: "/images/skills/nodejs.svg"
  },
  {
    name: "Nginx",
    logo: "/images/skills/nginx.png"
  },
  {
    name: "Laravel",
    logo: "/images/skills/laravel.svg"
  },
  {
    name: "Git",
    logo: "/images/skills/git.png"
  },
  {
    name: "CI/CD Pipeline",
    isIcon: true,
    icon: Infinity$1,
    iconColors: ["#3B82F6", "#F97316"]
  },
  {
    name: "GitHub Actions",
    logo: "/images/skills/github-actions.svg"
  },
  {
    name: "Cypress",
    logo: "/images/skills/cypress.jpg"
  }
];
const FireIcon = () => /* @__PURE__ */ jsx("div", { className: "w-6 h-6 relative group-hover:scale-125 transition-transform duration-300", children: /* @__PURE__ */ jsx(
  "img",
  {
    src: "/images/icons/fire.gif",
    alt: "Hot skill indicator",
    className: "w-full h-full object-contain"
  }
) });
function SkillsShowcase() {
  return /* @__PURE__ */ jsx("section", { className: "py-20 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsx(
      motion.h2,
      {
        className: "text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900",
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        children: "Technical Expertise"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto", children: skills$1.map((skill, index) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "flex flex-col items-center",
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, delay: index * 0.1 },
        children: [
          /* @__PURE__ */ jsx("div", { className: "group relative", children: /* @__PURE__ */ jsxs("div", { className: "w-24 h-24 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm hover:scale-110 transition-transform duration-300 p-4", children: [
            skill.isIcon ? /* @__PURE__ */ jsx("div", { className: "relative", children: skill.iconColors ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(skill.icon, { className: "w-12 h-12 absolute text-[#3B82F6]", style: { transform: "translateX(-4px)" } }),
              /* @__PURE__ */ jsx(skill.icon, { className: "w-12 h-12 absolute text-[#F97316]", style: { transform: "translateX(4px)" } })
            ] }) : /* @__PURE__ */ jsx(skill.icon, { className: "w-12 h-12 text-[#06B6D4] animate-pulse" }) }) : /* @__PURE__ */ jsx(
              "img",
              {
                src: skill.logo || "/placeholder.svg",
                alt: `${skill.name} logo`,
                className: "w-full h-full object-contain"
              }
            ),
            skill.isHot && /* @__PURE__ */ jsx("div", { className: "absolute -top-2 -right-2", children: /* @__PURE__ */ jsx(FireIcon, {}) })
          ] }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900", children: skill.name })
        ]
      },
      skill.name
    )) })
  ] }) });
}
const values = [
  {
    icon: Lightbulb,
    title: "Continuous Learning",
    description: "Embracing new technologies and methodologies to stay at the forefront of the industry."
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Fostering teamwork and knowledge sharing to achieve collective success."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Pushing boundaries and thinking outside the box to solve complex problems."
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Bringing enthusiasm and dedication to every project and challenge."
  }
];
function PersonalValues() {
  return /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsx(
      motion.h2,
      {
        className: "text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900",
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        children: "Personal Values"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: values.map((value, index) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "bg-gray-50 rounded-lg p-6 shadow-md",
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, delay: index * 0.1 },
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-[#86D2F1] to-[#7C3AED] flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(value.icon, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: value.title }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: value.description })
        ]
      },
      value.title
    )) })
  ] }) });
}
const Accordion = AccordionPrimitive.Root;
const AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Item,
  {
    ref,
    className: cn("border-b", className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = "AccordionTrigger";
const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    className: cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: "pb-4 pt-0", children })
  }
));
AccordionContent.displayName = "AccordionContent";
const faqs$1 = [
  {
    question: "What is Harun's expertise in AWS and cloud architecture?",
    answer: "With 12 AWS certifications and over 7 years of AWS experience, I specialize in designing and implementing scalable cloud architectures. I've successfully reduced cloud costs by 30-40% while improving performance for various organizations. My expertise includes serverless architecture, containerization, and implementing infrastructure as code (IaC) using Terraform and AWS CDK."
  },
  {
    question: "How does Harun approach DevOps and CI/CD implementation?",
    answer: "I implement robust CI/CD pipelines using tools like Jenkins, GitHub Actions, and AWS CodePipeline. My approach focuses on automation, continuous testing, and infrastructure as code. I've helped teams achieve 3x faster deployment cycles and 99.9% uptime through effective DevOps practices."
  },
  {
    question: "What experience does Harun have with containerization and Kubernetes?",
    answer: "As a certified Kubernetes administrator, I have extensive experience orchestrating containerized applications. I've implemented and managed Kubernetes clusters on AWS EKS, handling microservices architectures serving millions of requests. I also work with Docker for containerization and implement container security best practices."
  },
  {
    question: "Can Harun help with cloud cost optimization?",
    answer: "Yes, I specialize in cloud cost optimization. I've helped multiple organizations reduce their AWS costs by 30-40% through right-sizing instances, implementing auto-scaling, utilizing spot instances, and optimizing resource usage. I also implement FinOps practices for long-term cost management."
  },
  {
    question: "What programming languages does Harun work with?",
    answer: "I'm proficient in multiple programming languages including Python, Go, Node.js, and PHP (Laravel). I use these languages for backend development, automation scripts, and cloud-native applications. My polyglot approach allows me to choose the best tool for specific use cases."
  },
  {
    question: "How does Harun handle application security?",
    answer: "Security is integral to my work. I implement security best practices including IAM policies, network security, encryption at rest and in transit, and security compliance. I also have experience with AWS security services and implementing security automation in CI/CD pipelines."
  },
  {
    question: "What is Harun's experience with infrastructure as code (IaC)?",
    answer: "I'm an expert in infrastructure as code using Terraform and AWS CDK. I've implemented IaC for complete cloud infrastructures, reducing deployment times from days to hours and ensuring consistency across environments. I also maintain infrastructure version control and implement automated testing for infrastructure code."
  },
  {
    question: "How does Harun approach system monitoring and observability?",
    answer: "I implement comprehensive monitoring solutions using tools like AWS CloudWatch, Prometheus, and Grafana. My approach includes setting up automated alerts, creating detailed dashboards, and implementing logging strategies. This ensures high availability and quick problem resolution."
  },
  {
    question: "What is Harun's experience with serverless architecture?",
    answer: "I have extensive experience building serverless applications using AWS Lambda, API Gateway, and other AWS serverless services. I've helped organizations reduce operational overhead and improve scalability through serverless architectures, while implementing best practices for serverless security and performance optimization."
  },
  {
    question: "How does Harun contribute to team development and mentoring?",
    answer: "As an AWS Community Builder and technical leader, I actively mentor team members in cloud and DevOps practices. I conduct workshops, create documentation, and share knowledge through blog posts and presentations. I believe in building strong, collaborative teams that can deliver high-quality solutions."
  }
];
function FAQSection() {
  return /* @__PURE__ */ jsx("section", { className: "py-20 pb-32 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        className: "text-center mb-16",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl lg:text-4xl font-bold text-gray-900 mb-6", children: "Frequently Asked Questions" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Common questions about my expertise, experience, and approach to software engineering and cloud architecture." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.8 },
          children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "w-full space-y-4", children: faqs$1.map((faq, index) => /* @__PURE__ */ jsxs(
            AccordionItem,
            {
              value: `item-${index}`,
              className: "bg-white rounded-lg shadow-sm border border-gray-200",
              children: [
                /* @__PURE__ */ jsx(AccordionTrigger, { className: "px-6 text-left hover:no-underline", children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900", children: faq.question }) }),
                /* @__PURE__ */ jsx(AccordionContent, { className: "px-6 pb-6", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600 leading-relaxed", children: faq.answer }) })
              ]
            },
            index
          )) })
        }
      ),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.8, delay: 0.2 },
          className: "mt-12 text-center",
          children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(
            Button,
            {
              size: "lg",
              className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all duration-300 group",
              children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "w-5 h-5 mr-2 group-hover:animate-bounce" }),
                "Not covered your question? Ask Harun"
              ]
            }
          ) })
        }
      )
    ] })
  ] }) });
}
function VolunteeringSection() {
  return /* @__PURE__ */ jsx("section", { className: "py-12 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        className: "text-center mb-12",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl lg:text-4xl font-bold text-gray-900 mb-6", children: "Community Involvement" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Giving back to the tech community through knowledge sharing and mentorship." })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8 },
        children: /* @__PURE__ */ jsx("div", { className: "rounded-xl border bg-gradient-to-br from-[#86D2F1]/5 to-[#7C3AED]/5 shadow p-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-32 h-32 rounded-lg flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "/images/community/aws-community-builder.png",
              alt: "AWS Community Builder",
              className: "w-32 h-32 object-contain"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-3", children: "AWS Community Builder" }),
            /* @__PURE__ */ jsx("p", { className: "text-[#7C3AED] font-medium text-lg mb-2", children: "Amazon Web Services (AWS)" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg mb-4", children: "Mar 2022 - Present" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg leading-relaxed mb-8", children: "AWS Community Builders are enthusiasts and emerging thought leaders who are passionate about AWS technology, and cloud computing. Our work as content creators and evangelists supports and encourages others in the broader technical community along their cloud journeys. By sharing our thoughts and experiences, we also grow and network as a group. AWS also supports the Community Builders through specialized webinars, panels, and resources." }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Award, { className: "w-5 h-5 text-[#7C3AED]" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-medium text-lg pt-1", children: "Recognized as a Top Content Contributor for Q2 2022 in the APJ Region" })
            ] })
          ] })
        ] }) })
      }
    ) })
  ] }) });
}
function About() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "About - Harun" }),
    /* @__PURE__ */ jsxs("main", { className: "relative min-h-screen", children: [
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Menubar, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(AboutHero, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(SkillsShowcase, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(PersonalValues, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(VolunteeringSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(JourneyTimeline, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(FAQSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Footer, {}) })
    ] })
  ] });
}
const __vite_glob_0_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: About
}, Symbol.toStringTag, { value: "Module" }));
function InputError({
  message,
  className = "",
  ...props
}) {
  return message ? /* @__PURE__ */ jsx(
    "p",
    {
      ...props,
      className: "text-sm text-red-600 " + className,
      children: message
    }
  ) : null;
}
function InputLabel({
  value,
  className = "",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "label",
    {
      ...props,
      className: `block text-sm font-medium text-gray-700 ` + className,
      children: value ? value : children
    }
  );
}
function PrimaryButton({
  className = "",
  disabled,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      ...props,
      className: `inline-flex items-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-900 ${disabled && "opacity-25"} ` + className,
      disabled,
      children
    }
  );
}
const TextInput = forwardRef(function TextInput2({
  type = "text",
  className = "",
  isFocused = false,
  ...props
}, ref) {
  const localRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => {
      var _a;
      return (_a = localRef.current) == null ? void 0 : _a.focus();
    }
  }));
  useEffect(() => {
    var _a;
    if (isFocused) {
      (_a = localRef.current) == null ? void 0 : _a.focus();
    }
  }, [isFocused]);
  return /* @__PURE__ */ jsx(
    "input",
    {
      ...props,
      type,
      className: "rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 " + className,
      ref: localRef
    }
  );
});
function ApplicationLogo(props) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      ...props,
      viewBox: "0 0 316 316",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx("path", { d: "M305.8 81.125C305.77 80.995 305.69 80.885 305.65 80.755C305.56 80.525 305.49 80.285 305.37 80.075C305.29 79.935 305.17 79.815 305.07 79.685C304.94 79.515 304.83 79.325 304.68 79.175C304.55 79.045 304.39 78.955 304.25 78.845C304.09 78.715 303.95 78.575 303.77 78.475L251.32 48.275C249.97 47.495 248.31 47.495 246.96 48.275L194.51 78.475C194.33 78.575 194.19 78.725 194.03 78.845C193.89 78.955 193.73 79.045 193.6 79.175C193.45 79.325 193.34 79.515 193.21 79.685C193.11 79.815 192.99 79.935 192.91 80.075C192.79 80.285 192.71 80.525 192.63 80.755C192.58 80.875 192.51 80.995 192.48 81.125C192.38 81.495 192.33 81.875 192.33 82.265V139.625L148.62 164.795V52.575C148.62 52.185 148.57 51.805 148.47 51.435C148.44 51.305 148.36 51.195 148.32 51.065C148.23 50.835 148.16 50.595 148.04 50.385C147.96 50.245 147.84 50.125 147.74 49.995C147.61 49.825 147.5 49.635 147.35 49.485C147.22 49.355 147.06 49.265 146.92 49.155C146.76 49.025 146.62 48.885 146.44 48.785L93.99 18.585C92.64 17.805 90.98 17.805 89.63 18.585L37.18 48.785C37 48.885 36.86 49.035 36.7 49.155C36.56 49.265 36.4 49.355 36.27 49.485C36.12 49.635 36.01 49.825 35.88 49.995C35.78 50.125 35.66 50.245 35.58 50.385C35.46 50.595 35.38 50.835 35.3 51.065C35.25 51.185 35.18 51.305 35.15 51.435C35.05 51.805 35 52.185 35 52.575V232.235C35 233.795 35.84 235.245 37.19 236.025L142.1 296.425C142.33 296.555 142.58 296.635 142.82 296.725C142.93 296.765 143.04 296.835 143.16 296.865C143.53 296.965 143.9 297.015 144.28 297.015C144.66 297.015 145.03 296.965 145.4 296.865C145.5 296.835 145.59 296.775 145.69 296.745C145.95 296.655 146.21 296.565 146.45 296.435L251.36 236.035C252.72 235.255 253.55 233.815 253.55 232.245V174.885L303.81 145.945C305.17 145.165 306 143.725 306 142.155V82.265C305.95 81.875 305.89 81.495 305.8 81.125ZM144.2 227.205L100.57 202.515L146.39 176.135L196.66 147.195L240.33 172.335L208.29 190.625L144.2 227.205ZM244.75 114.995V164.795L226.39 154.225L201.03 139.625V89.825L219.39 100.395L244.75 114.995ZM249.12 57.105L292.81 82.265L249.12 107.425L205.43 82.265L249.12 57.105ZM114.49 184.425L96.13 194.995V85.305L121.49 70.705L139.85 60.135V169.815L114.49 184.425ZM91.76 27.425L135.45 52.585L91.76 77.745L48.07 52.585L91.76 27.425ZM43.67 60.135L62.03 70.705L87.39 85.305V202.545V202.555V202.565C87.39 202.735 87.44 202.895 87.46 203.055C87.49 203.265 87.49 203.485 87.55 203.695V203.705C87.6 203.875 87.69 204.035 87.76 204.195C87.84 204.375 87.89 204.575 87.99 204.745C87.99 204.745 87.99 204.755 88 204.755C88.09 204.905 88.22 205.035 88.33 205.175C88.45 205.335 88.55 205.495 88.69 205.635L88.7 205.645C88.82 205.765 88.98 205.855 89.12 205.965C89.28 206.085 89.42 206.225 89.59 206.325C89.6 206.325 89.6 206.325 89.61 206.335C89.62 206.335 89.62 206.345 89.63 206.345L139.87 234.775V285.065L43.67 229.705V60.135ZM244.75 229.705L148.58 285.075V234.775L219.8 194.115L244.75 179.875V229.705ZM297.2 139.625L253.49 164.795V114.995L278.85 100.395L297.21 89.825V139.625H297.2Z" })
    }
  );
}
function Guest({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0", children: [
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Link, { href: "/", children: /* @__PURE__ */ jsx(ApplicationLogo, { className: "h-20 w-20 fill-current text-gray-500" }) }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg", children })
  ] });
}
function ConfirmPassword() {
  const { data, setData, post, processing, errors, reset } = useForm({
    password: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.confirm"), {
      onFinish: () => reset("password")
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Confirm Password" }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm text-gray-600", children: "This is a secure area of the application. Please confirm your password before continuing." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Password" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            type: "password",
            name: "password",
            value: data.password,
            className: "mt-1 block w-full",
            isFocused: true,
            onChange: (e) => setData("password", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-center justify-end", children: /* @__PURE__ */ jsx(PrimaryButton, { className: "ms-4", disabled: processing, children: "Confirm" }) })
    ] })
  ] });
}
const __vite_glob_0_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ConfirmPassword
}, Symbol.toStringTag, { value: "Module" }));
function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.email"));
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Forgot Password" }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm text-gray-600", children: "Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one." }),
    status && /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm font-medium text-green-600", children: status }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsx(
        TextInput,
        {
          id: "email",
          type: "email",
          name: "email",
          value: data.email,
          className: "mt-1 block w-full",
          isFocused: true,
          onChange: (e) => setData("email", e.target.value)
        }
      ),
      /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-center justify-end", children: /* @__PURE__ */ jsx(PrimaryButton, { className: "ms-4", disabled: processing, children: "Email Password Reset Link" }) })
    ] })
  ] });
}
const __vite_glob_0_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ForgotPassword
}, Symbol.toStringTag, { value: "Module" }));
function Checkbox({
  className = "",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      ...props,
      type: "checkbox",
      className: "rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 " + className
    }
  );
}
function Login({
  status,
  canResetPassword
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("login"), {
      onFinish: () => reset("password")
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Log in" }),
    status && /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm font-medium text-green-600", children: status }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "email",
            type: "email",
            name: "email",
            value: data.email,
            className: "mt-1 block w-full",
            autoComplete: "username",
            isFocused: true,
            onChange: (e) => setData("email", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Password" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            type: "password",
            name: "password",
            value: data.password,
            className: "mt-1 block w-full",
            autoComplete: "current-password",
            onChange: (e) => setData("password", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 block", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            name: "remember",
            checked: data.remember,
            onChange: (e) => setData("remember", e.target.checked)
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "ms-2 text-sm text-gray-600", children: "Remember me" })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-end", children: [
        canResetPassword && /* @__PURE__ */ jsx(
          Link,
          {
            href: route("password.request"),
            className: "rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            children: "Forgot your password?"
          }
        ),
        /* @__PURE__ */ jsx(PrimaryButton, { className: "ms-4", disabled: processing, children: "Log in" })
      ] })
    ] })
  ] });
}
const __vite_glob_0_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Login
}, Symbol.toStringTag, { value: "Module" }));
function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("register"), {
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Register" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Name" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "name",
            name: "name",
            value: data.name,
            className: "mt-1 block w-full",
            autoComplete: "name",
            isFocused: true,
            onChange: (e) => setData("name", e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.name, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "email",
            type: "email",
            name: "email",
            value: data.email,
            className: "mt-1 block w-full",
            autoComplete: "username",
            onChange: (e) => setData("email", e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Password" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            type: "password",
            name: "password",
            value: data.password,
            className: "mt-1 block w-full",
            autoComplete: "new-password",
            onChange: (e) => setData("password", e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(
          InputLabel,
          {
            htmlFor: "password_confirmation",
            value: "Confirm Password"
          }
        ),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password_confirmation",
            type: "password",
            name: "password_confirmation",
            value: data.password_confirmation,
            className: "mt-1 block w-full",
            autoComplete: "new-password",
            onChange: (e) => setData("password_confirmation", e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          InputError,
          {
            message: errors.password_confirmation,
            className: "mt-2"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-end", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("login"),
            className: "rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            children: "Already registered?"
          }
        ),
        /* @__PURE__ */ jsx(PrimaryButton, { className: "ms-4", disabled: processing, children: "Register" })
      ] })
    ] })
  ] });
}
const __vite_glob_0_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Register
}, Symbol.toStringTag, { value: "Module" }));
function ResetPassword({
  token,
  email
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: "",
    password_confirmation: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("password.store"), {
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Reset Password" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "email",
            type: "email",
            name: "email",
            value: data.email,
            className: "mt-1 block w-full",
            autoComplete: "username",
            onChange: (e) => setData("email", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.email, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "Password" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            type: "password",
            name: "password",
            value: data.password,
            className: "mt-1 block w-full",
            autoComplete: "new-password",
            isFocused: true,
            onChange: (e) => setData("password", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx(
          InputLabel,
          {
            htmlFor: "password_confirmation",
            value: "Confirm Password"
          }
        ),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            type: "password",
            name: "password_confirmation",
            value: data.password_confirmation,
            className: "mt-1 block w-full",
            autoComplete: "new-password",
            onChange: (e) => setData("password_confirmation", e.target.value)
          }
        ),
        /* @__PURE__ */ jsx(
          InputError,
          {
            message: errors.password_confirmation,
            className: "mt-2"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-center justify-end", children: /* @__PURE__ */ jsx(PrimaryButton, { className: "ms-4", disabled: processing, children: "Reset Password" }) })
    ] })
  ] });
}
const __vite_glob_0_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ResetPassword
}, Symbol.toStringTag, { value: "Module" }));
function VerifyEmail({ status }) {
  const { post, processing } = useForm({});
  const submit = (e) => {
    e.preventDefault();
    post(route("verification.send"));
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Email Verification" }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm text-gray-600", children: "Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another." }),
    status === "verification-link-sent" && /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm font-medium text-green-600", children: "A new verification link has been sent to the email address you provided during registration." }),
    /* @__PURE__ */ jsx("form", { onSubmit: submit, children: /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(PrimaryButton, { disabled: processing, children: "Resend Verification Email" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: route("logout"),
          method: "post",
          as: "button",
          className: "rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          children: "Log Out"
        }
      )
    ] }) })
  ] });
}
const __vite_glob_0_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: VerifyEmail
}, Symbol.toStringTag, { value: "Module" }));
const Card$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card$1.displayName = "Card";
const CardHeader$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader$1.displayName = "CardHeader";
const CardTitle$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle$1.displayName = "CardTitle";
const CardDescription$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription$1.displayName = "CardDescription";
const CardContent$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent$1.displayName = "CardContent";
const CardFooter$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter$1.displayName = "CardFooter";
function Book() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen relative", children: [
    /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 right-0 z-50", children: /* @__PURE__ */ jsx(Menubar, {}) }),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("section", { className: "min-h-[400px] bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6] flex items-center", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-20", children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8 },
          className: "text-center max-w-3xl mx-auto",
          children: [
            /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-4", children: "Schedule a Consultation" }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-white/80", children: "Book a 30-minute session to discuss your project needs and explore how we can work together to achieve your goals." })
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx("section", { className: "py-32 bg-gray-50 flex-grow", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsx(Card$1, { className: "max-w-2xl mx-auto shadow-lg", children: /* @__PURE__ */ jsx(CardContent$1, { className: "p-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-6", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "w-16 h-16 mx-auto text-[#7C3AED]" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gray-800", children: "Calendar Integration Coming Soon" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "We're currently setting up our booking system. For immediate assistance, please reach out via email." }),
        /* @__PURE__ */ jsx(Button, { className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: /* @__PURE__ */ jsx("a", { href: "mailto:hello@harun.dev", className: "text-white no-underline", children: "Contact via Email" }) })
      ] }) }) }) }) })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Book
}, Symbol.toStringTag, { value: "Module" }));
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const Label = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "label",
      {
        ref,
        className: cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        ),
        ...props
      }
    );
  }
);
Label.displayName = "Label";
const Command = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg border border-gray-100",
        className
      ),
      ...props
    }
  )
);
Command.displayName = "Command";
const CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: "flex items-center border-b px-3", children: /* @__PURE__ */ jsx(
  "input",
  {
    ref,
    className: cn(
      "flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props
  }
) }));
CommandInput.displayName = "CommandInput";
const CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = "CommandList";
const CommandEmpty = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("py-2 px-3 text-sm", className),
    ...props
  }
));
CommandEmpty.displayName = "CommandEmpty";
const CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "overflow-hidden px-3 text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = "CommandGroup";
const CommandItem = React.forwardRef(({ className, onSelect, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
      className
    ),
    onClick: onSelect,
    ...props
  }
));
CommandItem.displayName = "CommandItem";
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
const Envelope = ({ onComplete }) => {
  const containerVariants2 = {
    initial: {
      scale: 0.5,
      opacity: 0,
      y: 100
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      scale: 0.5,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "text-center",
      variants: containerVariants2,
      initial: "initial",
      animate: "animate",
      exit: "exit",
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Check, { className: "w-10 h-10 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-gray-900", children: "Message Sent Successfully!" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "Thank you for reaching out. We'll get back to you soon." })
        ] }),
        /* @__PURE__ */ jsx(
          motion.button,
          {
            onClick: onComplete,
            className: "mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors",
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 },
            children: "Submit Another Request"
          }
        )
      ] })
    }
  );
};
function Layout({
  children,
  title,
  description,
  keywords,
  ogImage
}) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: title }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
      /* @__PURE__ */ jsx("meta", { name: "keywords", content: keywords }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: title }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: ogImage }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: title }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: ogImage })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-white", children: [
      /* @__PURE__ */ jsx(Menubar, {}),
      /* @__PURE__ */ jsx("main", { children }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
}
const predefinedServices = [
  "Cloud Architecture & Migration",
  "DevOps Implementation",
  "Infrastructure as Code (IaC)",
  "Containerization & Orchestration",
  "CI/CD Pipeline Optimization",
  "Serverless Architecture",
  "Microservices Design",
  "Performance Optimization",
  "Security & Compliance",
  "Monitoring & Logging",
  "Database Management",
  "Scalability Solutions"
];
Contact.title = "Contact Me";
Contact.description = "Get in touch with me for web development, cloud architecture, and DevOps services. I specialize in building modern, scalable web applications.";
Contact.keywords = "contact, web development, cloud architecture, DevOps, full-stack development, React, Laravel";
function Contact() {
  usePage().props;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [services2, setServices] = useState(predefinedServices);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referrer, setReferrer] = useState("");
  const [errors, setErrors] = useState({});
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showForm, setShowForm] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setReferrer(document.referrer || "direct");
      const textarea = document.getElementById("message");
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [message]);
  const triggerConfetti = () => {
    if (typeof window !== "undefined") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#7C3AED", "#8B5CF6", "#6D28D9"],
        angle: 90,
        startVelocity: 30,
        gravity: 0.5,
        ticks: 200
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    router.post("/contact", {
      name,
      email,
      subject,
      message,
      services: selectedServices,
      referrer
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsSubmitting(false);
        setShowEnvelope(true);
        setShowForm(false);
        triggerConfetti();
        toast.success("Thank you for your message! We will get back to you soon.", {
          duration: 5e3,
          position: "top-right"
        });
      },
      onError: (errors2) => {
        setErrors(errors2);
        toast.error("Please check the form for errors.", {
          duration: 5e3,
          position: "top-right"
        });
        setIsSubmitting(false);
      }
    });
  };
  const handleNewRequest = () => {
    resetForm();
    setShowEnvelope(false);
    setShowForm(true);
  };
  const resetForm = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSelectedServices([]);
    setShowForm(true);
  };
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    switch (id) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "subject":
        setSubject(value);
        break;
      case "message":
        setMessage(value);
        if (e.target instanceof HTMLTextAreaElement) {
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }
        break;
    }
  };
  const toggleService = (service) => {
    setSelectedServices(
      (current) => current.includes(service) ? current.filter((s) => s !== service) : [...current, service]
    );
  };
  const addCustomService = (value) => {
    const newService = value.trim();
    if (newService && !services2.includes(newService)) {
      setServices((prev) => [...prev, newService]);
      setSelectedServices((prev) => [...prev, newService]);
      setSearchValue("");
    }
  };
  return /* @__PURE__ */ jsxs(
    Layout,
    {
      title: Contact.title,
      description: Contact.description,
      keywords: Contact.keywords,
      ogImage: "/images/contact-og.jpg",
      children: [
        /* @__PURE__ */ jsx("div", { className: "min-h-screen", children: /* @__PURE__ */ jsx("section", { className: "py-32 bg-gray-50", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4", children: /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6 },
            className: "max-w-2xl mx-auto",
            children: /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
              showForm && /* @__PURE__ */ jsx(
                motion.div,
                {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                  transition: { duration: 0.3 },
                  children: /* @__PURE__ */ jsxs(
                    "form",
                    {
                      onSubmit: handleSubmit,
                      className: "space-y-8 bg-white p-12 rounded-xl shadow-lg border border-gray-100",
                      children: [
                        /* @__PURE__ */ jsx("input", { type: "hidden", name: "referrer", value: referrer }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                          /* @__PURE__ */ jsxs(Label, { htmlFor: "name", className: "text-xl font-medium", children: [
                            "Name ",
                            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              id: "name",
                              value: name,
                              onChange: handleInputChange,
                              placeholder: "Enter your name",
                              className: cn(
                                "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-xl h-16 px-5",
                                errors.name && "border-red-500 focus:border-red-500"
                              ),
                              required: true
                            }
                          ),
                          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                          /* @__PURE__ */ jsxs(Label, { htmlFor: "email", className: "text-xl font-medium", children: [
                            "Email ",
                            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              id: "email",
                              type: "email",
                              value: email,
                              onChange: handleInputChange,
                              placeholder: "Enter your email address",
                              className: cn(
                                "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-xl h-16 px-5",
                                errors.email && "border-red-500 focus:border-red-500"
                              ),
                              required: true
                            }
                          ),
                          errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                          /* @__PURE__ */ jsxs(Label, { htmlFor: "subject", className: "text-xl font-medium", children: [
                            "Subject ",
                            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              id: "subject",
                              value: subject,
                              onChange: handleInputChange,
                              placeholder: "What is your message about?",
                              className: cn(
                                "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-xl h-16 px-5",
                                errors.subject && "border-red-500 focus:border-red-500"
                              ),
                              required: true
                            }
                          ),
                          errors.subject && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.subject })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                          /* @__PURE__ */ jsxs(Label, { htmlFor: "message", className: "text-xl font-medium", children: [
                            "Message ",
                            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            Textarea,
                            {
                              id: "message",
                              value: message,
                              onChange: handleInputChange,
                              placeholder: "Write your message here...",
                              className: cn(
                                "min-h-[150px] resize-none overflow-hidden bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-xl p-5",
                                errors.message && "border-red-500 focus:border-red-500"
                              ),
                              required: true
                            }
                          ),
                          errors.message && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.message })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsx(Label, { htmlFor: "services", className: "text-lg font-medium", children: "Services" }),
                          /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
                            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                              Button,
                              {
                                variant: "outline",
                                role: "combobox",
                                "aria-expanded": open,
                                className: "w-full justify-between bg-gray-50/50 border-gray-200 hover:bg-gray-50/80 text-lg h-14 px-4",
                                children: [
                                  selectedServices.length > 0 ? `${selectedServices.length} selected` : "Select services",
                                  /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
                                ]
                              }
                            ) }),
                            /* @__PURE__ */ jsx(PopoverContent, { className: "w-[--radix-popover-trigger-width] p-0", children: /* @__PURE__ */ jsxs(Command, { children: [
                              /* @__PURE__ */ jsx(
                                CommandInput,
                                {
                                  placeholder: "Search or add services...",
                                  value: searchValue,
                                  onChange: (e) => setSearchValue(e.target.value)
                                }
                              ),
                              /* @__PURE__ */ jsxs(CommandList, { children: [
                                /* @__PURE__ */ jsx(CommandEmpty, { children: searchValue.trim() ? /* @__PURE__ */ jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => addCustomService(searchValue),
                                    className: "flex w-full items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                    children: [
                                      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                                      'Add "',
                                      searchValue,
                                      '"'
                                    ]
                                  }
                                ) : null }),
                                /* @__PURE__ */ jsx(CommandGroup, { children: services2.filter((service) => service.toLowerCase().includes(searchValue.toLowerCase())).map((service) => /* @__PURE__ */ jsxs(
                                  CommandItem,
                                  {
                                    onSelect: () => toggleService(service),
                                    children: [
                                      /* @__PURE__ */ jsx(
                                        Check,
                                        {
                                          className: cn(
                                            "mr-2 h-4 w-4",
                                            selectedServices.includes(service) ? "opacity-100" : "opacity-0"
                                          )
                                        }
                                      ),
                                      service
                                    ]
                                  },
                                  service
                                )) })
                              ] })
                            ] }) })
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: selectedServices.map((service) => /* @__PURE__ */ jsxs(
                            "span",
                            {
                              className: "bg-[#7C3AED] text-white px-2 py-1 rounded-full text-sm",
                              children: [
                                service,
                                /* @__PURE__ */ jsx(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => toggleService(service),
                                    className: "ml-2 focus:outline-none",
                                    children: "×"
                                  }
                                )
                              ]
                            },
                            service
                          )) })
                        ] }),
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            type: "submit",
                            disabled: isSubmitting,
                            className: "h-16 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xl font-semibold px-10 rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed",
                            children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-6 w-6 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
                              ] }),
                              /* @__PURE__ */ jsx("span", { className: "ml-2", children: "Sending..." })
                            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                              /* @__PURE__ */ jsx(Send, { className: "w-6 h-6" }),
                              "Send Message"
                            ] })
                          }
                        )
                      ]
                    }
                  )
                },
                "form"
              ),
              showEnvelope && /* @__PURE__ */ jsx(
                motion.div,
                {
                  className: "bg-white p-12 rounded-xl shadow-lg border border-gray-100",
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                  children: /* @__PURE__ */ jsx(Envelope, { onComplete: handleNewRequest })
                },
                "confirmation"
              )
            ] })
          }
        ) }) }) }),
        /* @__PURE__ */ jsx(Toaster, {})
      ]
    }
  );
}
const __vite_glob_0_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Contact
}, Symbol.toStringTag, { value: "Module" }));
const DropDownContext = createContext({
  open: false,
  setOpen: () => {
  },
  toggleOpen: () => {
  }
});
const Dropdown = ({ children }) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };
  return /* @__PURE__ */ jsx(DropDownContext.Provider, { value: { open, setOpen, toggleOpen }, children: /* @__PURE__ */ jsx("div", { className: "relative", children }) });
};
const Trigger = ({ children }) => {
  const { open, setOpen, toggleOpen } = useContext(DropDownContext);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { onClick: toggleOpen, children }),
    open && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40",
        onClick: () => setOpen(false)
      }
    )
  ] });
};
const Content = ({
  align = "right",
  width = "48",
  contentClasses = "py-1 bg-white",
  children
}) => {
  const { open, setOpen } = useContext(DropDownContext);
  let alignmentClasses = "origin-top";
  if (align === "left") {
    alignmentClasses = "ltr:origin-top-left rtl:origin-top-right start-0";
  } else if (align === "right") {
    alignmentClasses = "ltr:origin-top-right rtl:origin-top-left end-0";
  }
  let widthClasses = "";
  if (width === "48") {
    widthClasses = "w-48";
  }
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Transition,
    {
      show: open,
      enter: "transition ease-out duration-200",
      enterFrom: "opacity-0 scale-95",
      enterTo: "opacity-100 scale-100",
      leave: "transition ease-in duration-75",
      leaveFrom: "opacity-100 scale-100",
      leaveTo: "opacity-0 scale-95",
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`,
          onClick: () => setOpen(false),
          children: /* @__PURE__ */ jsx(
            "div",
            {
              className: `rounded-md ring-1 ring-black ring-opacity-5 ` + contentClasses,
              children
            }
          )
        }
      )
    }
  ) });
};
const DropdownLink = ({
  className = "",
  children,
  ...props
}) => {
  return /* @__PURE__ */ jsx(
    Link,
    {
      ...props,
      className: "block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none " + className,
      children
    }
  );
};
Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
function NavLink({
  active = false,
  className = "",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      ...props,
      className: "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " + (active ? "border-indigo-400 text-gray-900 focus:border-indigo-700" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700") + className,
      children
    }
  );
}
function ResponsiveNavLink({
  active = false,
  className = "",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      ...props,
      className: `flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${active ? "border-indigo-400 bg-indigo-50 text-indigo-700 focus:border-indigo-700 focus:bg-indigo-100 focus:text-indigo-800" : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800"} text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`,
      children
    }
  );
}
function Authenticated({
  header,
  children
}) {
  const user = usePage().props.auth.user;
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-100", children: [
    /* @__PURE__ */ jsxs("nav", { className: "border-b border-gray-100 bg-white", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex h-16 justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex", children: [
          /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center", children: /* @__PURE__ */ jsx(Link, { href: "/", children: /* @__PURE__ */ jsx(ApplicationLogo, { className: "block h-9 w-auto fill-current text-gray-800" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "hidden space-x-8 sm:-my-px sm:ms-10 sm:flex", children: /* @__PURE__ */ jsx(
            NavLink,
            {
              href: route("dashboard"),
              active: route().current("dashboard"),
              children: "Dashboard"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden sm:ms-6 sm:flex sm:items-center", children: /* @__PURE__ */ jsx("div", { className: "relative ms-3", children: /* @__PURE__ */ jsxs(Dropdown, { children: [
          /* @__PURE__ */ jsx(Dropdown.Trigger, { children: /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-md", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none",
              children: [
                user.name,
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "-me-0.5 ms-2 h-4 w-4",
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 20 20",
                    fill: "currentColor",
                    children: /* @__PURE__ */ jsx(
                      "path",
                      {
                        fillRule: "evenodd",
                        d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                        clipRule: "evenodd"
                      }
                    )
                  }
                )
              ]
            }
          ) }) }),
          /* @__PURE__ */ jsxs(Dropdown.Content, { children: [
            /* @__PURE__ */ jsx(
              Dropdown.Link,
              {
                href: route("profile.edit"),
                children: "Profile"
              }
            ),
            /* @__PURE__ */ jsx(
              Dropdown.Link,
              {
                href: route("logout"),
                method: "post",
                as: "button",
                children: "Log Out"
              }
            )
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("div", { className: "-me-2 flex items-center sm:hidden", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowingNavigationDropdown(
              (previousState) => !previousState
            ),
            className: "inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none",
            children: /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "h-6 w-6",
                stroke: "currentColor",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: !showingNavigationDropdown ? "inline-flex" : "hidden",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M4 6h16M4 12h16M4 18h16"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: showingNavigationDropdown ? "inline-flex" : "hidden",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: "2",
                      d: "M6 18L18 6M6 6l12 12"
                    }
                  )
                ]
              }
            )
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: (showingNavigationDropdown ? "block" : "hidden") + " sm:hidden",
          children: [
            /* @__PURE__ */ jsx("div", { className: "space-y-1 pb-3 pt-2", children: /* @__PURE__ */ jsx(
              ResponsiveNavLink,
              {
                href: route("dashboard"),
                active: route().current("dashboard"),
                children: "Dashboard"
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 pb-1 pt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-4", children: [
                /* @__PURE__ */ jsx("div", { className: "text-base font-medium text-gray-800", children: user.name }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-500", children: user.email })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1", children: [
                /* @__PURE__ */ jsx(ResponsiveNavLink, { href: route("profile.edit"), children: "Profile" }),
                /* @__PURE__ */ jsx(
                  ResponsiveNavLink,
                  {
                    method: "post",
                    href: route("logout"),
                    as: "button",
                    children: "Log Out"
                  }
                )
              ] })
            ] })
          ]
        }
      )
    ] }),
    header && /* @__PURE__ */ jsx("header", { className: "bg-white shadow", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8", children: header }) }),
    /* @__PURE__ */ jsx("main", { children })
  ] });
}
function Dashboard() {
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold leading-tight text-gray-800", children: "Dashboard" }),
      children: [
        /* @__PURE__ */ jsx(Head, { title: "Dashboard" }),
        /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden bg-white shadow-sm sm:rounded-lg", children: /* @__PURE__ */ jsx("div", { className: "p-6 text-gray-900", children: "You're logged in!" }) }) }) })
      ]
    }
  );
}
const __vite_glob_0_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Dashboard
}, Symbol.toStringTag, { value: "Module" }));
const phrases = [
  "Senior Software Engineer",
  "12x AWS Certified",
  "DevOps Engineer",
  "Software Consultant",
  "Cloud Specialist"
];
const LOGO_SIZE = 55;
const logos = [
  { name: "DevOps", image: "https://cdn.worldvectorlogo.com/logos/devops-2.svg" },
  { name: "AWS", image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
  { name: "Docker", image: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" },
  { name: "Kubernetes", image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg" },
  { name: "Terraform", image: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
  { name: "GitHub", image: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" },
  { name: "Golang", image: "https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg" },
  { name: "Jenkins", image: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg" }
].map((logo) => ({
  ...logo,
  scale: 1,
  targetScale: 1,
  scaleSpeed: Math.random() * 0.02 + 0.01
}));
function HeroSectionV2() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const typeWriter = useCallback(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    if (isPaused) return;
    if (!isDeleting && currentText === currentPhrase) {
      setIsPaused(true);
      setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 3e3);
      return;
    }
    if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      return;
    }
    setCurrentText(
      (prev) => isDeleting ? prev.slice(0, -1) : currentPhrase.slice(0, prev.length + 1)
    );
  }, [currentPhraseIndex, currentText, isDeleting, isPaused]);
  useEffect(() => {
    const timer = setTimeout(typeWriter, isDeleting ? 75 : 150);
    return () => clearTimeout(timer);
  }, [typeWriter, isDeleting]);
  useEffect(() => {
    const calculateNodePosition = (centerX, centerY, radius, angle) => {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    };
    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.45;
      const newNodes = logos.map((logo, index) => {
        const angle = index / logos.length * 2 * Math.PI;
        const position = calculateNodePosition(centerX, centerY, radius, angle);
        return {
          id: index,
          ...position,
          logo,
          angle,
          scale: logo.scale,
          targetScale: logo.targetScale,
          scaleSpeed: logo.scaleSpeed
        };
      });
      setNodes(newNodes);
      setEdges(generateEdges(newNodes));
    };
    const generateEdges = (nodes2) => {
      const edges2 = [];
      for (let i = 0; i < nodes2.length; i++) {
        for (let j = i + 1; j < nodes2.length; j++) {
          const sourceScale = nodes2[i].scale;
          const targetScale = nodes2[j].scale;
          edges2.push({
            source: {
              x: nodes2[i].x,
              y: nodes2[i].y,
              scale: sourceScale
            },
            target: {
              x: nodes2[j].x,
              y: nodes2[j].y,
              scale: targetScale
            }
          });
        }
      }
      return edges2;
    };
    const updateScales = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1e3;
      lastUpdateRef.current = now;
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          const logo = logos[node.id];
          let newScale = node.scale;
          if (Math.abs(logo.targetScale - node.scale) < 5e-4) {
            logo.targetScale = Math.random() * 0.2 + 0.9;
            logo.scaleSpeed = Math.random() * 0.02 + 0.01;
          }
          if (node.scale < logo.targetScale) {
            newScale = Math.min(node.scale + logo.scaleSpeed * deltaTime, logo.targetScale);
          } else {
            newScale = Math.max(node.scale - logo.scaleSpeed * deltaTime, logo.targetScale);
          }
          logo.scale = newScale;
          return {
            ...node,
            scale: newScale
          };
        });
      });
    };
    updatePositions();
    window.addEventListener("resize", updatePositions);
    const animate = () => {
      updateScales();
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) => {
          const newAngle = node.angle + 5e-4;
          const container = containerRef.current;
          if (!container) return node;
          const rect = container.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const radius = Math.min(rect.width, rect.height) * 0.45;
          const position = calculateNodePosition(centerX, centerY, radius, newAngle);
          return {
            ...node,
            ...position,
            angle: newAngle
          };
        });
        setEdges(generateEdges(updatedNodes));
        return updatedNodes;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener("resize", updatePositions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs("section", { className: "relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: [
    /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "absolute inset-0 pointer-events-none overflow-hidden", children: [
      /* @__PURE__ */ jsx("svg", { width: "100%", height: "100%", children: edges.map((edge, index) => /* @__PURE__ */ jsx(
        "line",
        {
          x1: edge.source.x,
          y1: edge.source.y,
          x2: edge.target.x,
          y2: edge.target.y,
          stroke: "rgba(255,255,255,0.1)",
          strokeWidth: "1"
        },
        index
      )) }),
      nodes.map((node) => /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "absolute transform -translate-x-1/2 -translate-y-1/2",
          style: {
            left: `${node.x}px`,
            top: `${node.y}px`,
            transform: `translate(-50%, -50%) scale(${node.scale})`,
            transition: "all 4s ease-out"
          },
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: node.logo.image,
              alt: node.logo.name,
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              className: "w-14 h-14 rounded-full bg-white/10 p-2"
            }
          )
        },
        node.id
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen relative z-20 text-center", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "max-w-3xl",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8 },
        children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-bold mb-4 text-white", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xl md:text-2xl block mb-2", children: [
              "Hi ",
              /* @__PURE__ */ jsx("span", { className: "text-[#6EE7B7]", children: "👋" }),
              ", I'm"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6EE7B7]", children: "Harun R. Rayhan" })
          ] }),
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-3xl font-semibold mb-6 text-[#6EE7B7] h-10", children: [
            currentText,
            !isPaused && /* @__PURE__ */ jsx("span", { className: "animate-blink", children: "_" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto", children: "A software engineer, architect, and consultant with over a decade of experience. I will make your applications and softwares run smoothly at scale with (virtually) unlimited users." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center bg-black/20 backdrop-blur-sm rounded-full px-4 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-white", children: [
              /* @__PURE__ */ jsx("div", { className: "flex", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(
                "svg",
                {
                  className: `w-4 h-4 ${i < 5 ? "text-yellow-400" : "text-gray-400"}`,
                  fill: "currentColor",
                  viewBox: "0 0 20 20",
                  children: /* @__PURE__ */ jsx("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })
                },
                i
              )) }),
              /* @__PURE__ */ jsx("span", { className: "ml-1 text-sm font-semibold", children: "4.8" }),
              /* @__PURE__ */ jsx("span", { className: "mx-2 text-gray-300", children: "by 120+ clients" })
            ] }) }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: "#testimonials",
                className: "group flex items-center gap-2 text-white hover:text-[#6EE7B7] transition-colors duration-300",
                children: [
                  "Checkout what clients says",
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8", children: [
            /* @__PURE__ */ jsx(
              motion.div,
              {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 },
                children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "default",
                    size: "lg",
                    className: "w-full sm:w-auto relative overflow-hidden group bg-white/10 backdrop-blur-sm border border-[#6EE7B7]/20 hover:bg-white/20 text-white transition-all duration-300",
                    children: [
                      "Contact Me",
                      /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" })
                    ]
                  }
                ) })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 },
                children: /* @__PURE__ */ jsx(Link, { href: "/book-session", children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "default",
                    size: "lg",
                    className: "w-full sm:w-auto relative overflow-hidden group !bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white transition-all duration-300",
                    children: [
                      "Book a Session",
                      /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" })
                    ]
                  }
                ) })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-center space-x-4", children: [
            /* @__PURE__ */ jsx(
              motion.a,
              {
                href: "https://github.com/yourusername",
                target: "_blank",
                rel: "noopener noreferrer",
                "aria-label": "GitHub Profile",
                whileHover: { scale: 1.1, rotate: 5 },
                whileTap: { scale: 0.9 },
                children: /* @__PURE__ */ jsx(Github, { className: "w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.a,
              {
                href: "https://twitter.com/yourusername",
                target: "_blank",
                rel: "noopener noreferrer",
                "aria-label": "Twitter Profile",
                whileHover: { scale: 1.1, rotate: 5 },
                whileTap: { scale: 0.9 },
                children: /* @__PURE__ */ jsx(Twitter, { className: "w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.a,
              {
                href: "https://linkedin.com/in/yourusername",
                target: "_blank",
                rel: "noopener noreferrer",
                "aria-label": "LinkedIn Profile",
                whileHover: { scale: 1.1, rotate: 5 },
                whileTap: { scale: 0.9 },
                children: /* @__PURE__ */ jsx(Linkedin, { className: "w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" })
              }
            )
          ] })
        ]
      }
    ) })
  ] });
}
const companies = [
  {
    name: "Microsoft",
    logo: "/images/companies/microsoft.svg"
  },
  {
    name: "Amazon",
    logo: "/images/companies/amazon.svg"
  },
  {
    name: "Google",
    logo: "/images/companies/google.svg"
  },
  {
    name: "Apple",
    logo: "/images/companies/apple.svg"
  },
  {
    name: "Meta",
    logo: "/images/companies/meta.svg"
  },
  // Duplicate for infinite scroll
  {
    name: "Microsoft",
    logo: "/images/companies/microsoft.svg"
  },
  {
    name: "Amazon",
    logo: "/images/companies/amazon.svg"
  },
  {
    name: "Google",
    logo: "/images/companies/google.svg"
  },
  {
    name: "Apple",
    logo: "/images/companies/apple.svg"
  },
  {
    name: "Meta",
    logo: "/images/companies/meta.svg"
  }
];
function LogoSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs("section", { ref: sectionRef, className: "py-24 bg-[#F8F9FA] overflow-hidden", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
        transition: { duration: 0.8, ease: "easeOut" },
        className: "container mx-auto px-4 text-center mb-12",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Used by Companies Globally" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "Trusted by tech industry leaders and innovators." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" }),
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" }),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { x: 0 },
          animate: { x: "-50%" },
          transition: {
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          },
          whileHover: { scale: 0.95 },
          className: "group flex items-center space-x-24 whitespace-nowrap py-8",
          children: companies.map((company, index) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex-shrink-0 h-12 w-[180px] transition-all duration-300 group-hover:scale-110",
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: company.logo,
                  alt: `${company.name} logo`,
                  className: "w-full h-full object-contain"
                }
              )
            },
            `${company.name}-${index}`
          ))
        }
      )
    ] })
  ] });
}
const skills = [
  {
    icon: Code2,
    title: "17+ years as a software engineer",
    description: "Polyglot engineer specializing in Backend Development, DevOps practices, and Cloud technologies. Experienced in building and scaling enterprise applications, with a focus on AWS solutions."
  },
  {
    icon: Cloud,
    title: "12x AWS Certified Expert",
    description: "Comprehensive mastery of AWS services and architecture. Holds all AWS certifications, demonstrating deep expertise in cloud infrastructure, security, and DevOps methodologies."
  },
  {
    icon: Lightbulb,
    title: "10+ years of technical leadership",
    description: "Led and mentored engineering teams across multiple organizations. Expertise in architectural decisions, team building, and implementing best practices in cloud-native environments."
  }
];
const experiences = [
  {
    icon: Code2,
    title: "17+ years as a software engineer",
    description: "Polyglot engineer that's written code for Fortune 50 companies, startups (including his own), and everything in between. Harun enjoys mentoring and leading engineers as well as building out effective teams."
  },
  {
    icon: Cloud,
    title: "7+ years of building on AWS",
    description: "Harun builds, deploys and monitors complex solutions on AWS. Certifications? He got them all... in six weeks. He's also a contributor to the AWS CDK and is a big proponent of IaC."
  }
];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};
function SkillsSection() {
  return /* @__PURE__ */ jsxs("section", { className: "py-24 bg-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        className: "hidden lg:block absolute right-0 top-0 transform translate-x-1/3 -translate-y-1/4",
        width: "404",
        height: "784",
        fill: "none",
        viewBox: "0 0 404 784",
        "aria-hidden": "true",
        children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx(
            "pattern",
            {
              id: "skills-grid",
              x: "0",
              y: "0",
              width: "20",
              height: "20",
              patternUnits: "userSpaceOnUse",
              children: /* @__PURE__ */ jsx("rect", { x: "0", y: "0", width: "4", height: "4", className: "text-[#7C3AED]", fill: "currentColor" })
            }
          ) }),
          /* @__PURE__ */ jsx("rect", { width: "404", height: "784", fill: "url(#skills-grid)", className: "opacity-10" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.6 },
          className: "text-center mb-16",
          children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-6", children: "Harun's got (technical) skills." }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "These days, he's focusing on cloud architecture and DevOps practices, particularly with AWS. He's passionate about infrastructure as code (IaC), especially in Terraform and AWS CDK, and building scalable, resilient systems." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-12 mb-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-12", children: "Builder. Expert. Mentor." }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              variants: containerVariants,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "space-y-12",
              children: skills.map((skill, index) => /* @__PURE__ */ jsxs(
                motion.div,
                {
                  variants: itemVariants,
                  className: "flex gap-6",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center", children: /* @__PURE__ */ jsx(skill.icon, { className: "w-6 h-6 text-[#7C3AED]" }) }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h4", { className: "text-xl font-semibold text-gray-900 mb-2", children: skill.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-gray-600 leading-relaxed", children: skill.description })
                    ] })
                  ]
                },
                index
              ))
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true },
            transition: { duration: 0.6 },
            className: "flex items-center justify-center",
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: "/images/aws-certifications.png",
                alt: "AWS Certifications",
                className: "w-full h-auto max-w-lg hover:scale-105 transition-transform duration-300"
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "svg",
      {
        className: "hidden lg:block absolute left-0 bottom-0 transform -translate-x-1/4 translate-y-0",
        width: "404",
        height: "484",
        fill: "none",
        viewBox: "0 0 404 484",
        "aria-hidden": "true",
        children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx(
            "pattern",
            {
              id: "experience-grid",
              x: "0",
              y: "0",
              width: "20",
              height: "20",
              patternUnits: "userSpaceOnUse",
              children: /* @__PURE__ */ jsx("rect", { x: "0", y: "0", width: "4", height: "4", className: "text-[#7C3AED]", fill: "currentColor" })
            }
          ) }),
          /* @__PURE__ */ jsx("rect", { width: "404", height: "484", fill: "url(#experience-grid)", className: "opacity-10" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.6 },
          className: "text-center mb-16",
          children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-6", children: "Doer. Learner. Mentor." }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Harun is happiest when he's building things and learning. Sometimes he needs to go head down and accomplish something that he isn't sure is possible." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-12 mb-0", children: [
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true },
            transition: { duration: 0.6 },
            className: "flex items-center justify-center",
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: "/images/professional-certifications.png",
                alt: "Professional Certifications - Terraform Associate, Certified Scrum Developer, and Certified Scrum Master",
                className: "w-full h-auto max-w-[250px] hover:scale-105 transition-transform duration-300"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-gray-900 mb-12", children: "Experience & Impact" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              variants: containerVariants,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "space-y-12",
              children: experiences.map((experience, index) => /* @__PURE__ */ jsxs(
                motion.div,
                {
                  variants: itemVariants,
                  className: "flex gap-6",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center", children: /* @__PURE__ */ jsx(experience.icon, { className: "w-6 h-6 text-[#7C3AED]" }) }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h4", { className: "text-xl font-semibold text-gray-900 mb-2", children: experience.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-gray-600 leading-relaxed", children: experience.description })
                    ] })
                  ]
                },
                index
              ))
            }
          )
        ] })
      ] })
    ] })
  ] });
}
const technologies$c = [
  {
    name: "AWS",
    logo: "/images/tech/aws.svg"
  },
  {
    name: "Terraform",
    logo: "/images/tech/terraform.svg"
  },
  {
    name: "Docker",
    logo: "/images/tech/docker.svg"
  },
  {
    name: "Kubernetes",
    logo: "/images/tech/kubernetes.svg"
  },
  {
    name: "Jenkins",
    logo: "/images/tech/jenkins.svg"
  },
  {
    name: "GitHub Actions",
    logo: "/images/tech/github-actions.svg"
  },
  {
    name: "Laravel",
    logo: "/images/tech/laravel.svg"
  },
  {
    name: "React",
    logo: "/images/tech/react.svg"
  },
  {
    name: "Node.js",
    logo: "/images/tech/nodejs.svg"
  },
  {
    name: "Python",
    logo: "/images/tech/python.svg"
  },
  {
    name: "Go",
    logo: "/images/tech/go.svg"
  },
  {
    name: "Linux",
    logo: "/images/tech/linux.svg"
  },
  // Duplicate for infinite scroll
  {
    name: "AWS",
    logo: "/images/tech/aws.svg"
  },
  {
    name: "Terraform",
    logo: "/images/tech/terraform.svg"
  },
  {
    name: "Docker",
    logo: "/images/tech/docker.svg"
  },
  {
    name: "Kubernetes",
    logo: "/images/tech/kubernetes.svg"
  }
];
function TechStackSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs("section", { ref: sectionRef, className: "py-24 bg-[#F8F9FA] overflow-hidden", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
        transition: { duration: 0.8, ease: "easeOut" },
        className: "container mx-auto px-4 text-center mb-12",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Tech Stack & Expertise" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "Proficient in a wide range of modern technologies and tools." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" }),
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" }),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { x: 0 },
          animate: { x: "-50%" },
          transition: {
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          },
          whileHover: { scale: 0.95 },
          className: "group flex items-center space-x-16 whitespace-nowrap py-8",
          children: technologies$c.map((tech, index) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex-shrink-0 h-20 w-[200px] transition-all duration-300 group-hover:scale-110",
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: tech.logo,
                    alt: `${tech.name} logo`,
                    className: "w-16 h-16 object-contain"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-600", children: tech.name })
              ] })
            },
            `${tech.name}-${index}`
          ))
        }
      )
    ] })
  ] });
}
const reviews = [
  {
    id: 1,
    content: "Harun's expertise in AWS and DevOps practices transformed our infrastructure. His ability to architect scalable solutions and implement efficient CI/CD pipelines has been invaluable to our organization.",
    author: "Sarah Chen",
    position: "CTO at TechCorp",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    companyLogo: /* @__PURE__ */ jsx("svg", { className: "w-20 h-10", viewBox: "0 0 100 30", children: /* @__PURE__ */ jsx("text", { x: "0", y: "20", className: "text-gray-400 font-bold text-sm", children: "TechCorp" }) })
  },
  {
    id: 2,
    content: "Working with Harun was transformative for our cloud strategy. His deep knowledge of AWS and ability to optimize our infrastructure led to a 40% reduction in cloud costs while improving performance.",
    author: "Michael Rodriguez",
    position: "Lead Developer at CloudSolutions",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    companyLogo: /* @__PURE__ */ jsx("svg", { className: "w-20 h-10", viewBox: "0 0 100 30", children: /* @__PURE__ */ jsx("text", { x: "0", y: "20", className: "text-gray-400 font-bold text-sm", children: "CloudSolutions" }) })
  },
  {
    id: 3,
    content: "Harun's contributions to our DevOps processes revolutionized our deployment pipeline. His expertise in Kubernetes and Terraform helped us achieve true infrastructure as code.",
    author: "Emily Thompson",
    position: "DevOps Manager at InnovateInc",
    rating: 5,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    companyLogo: /* @__PURE__ */ jsx("svg", { className: "w-20 h-10", viewBox: "0 0 100 30", children: /* @__PURE__ */ jsx("text", { x: "0", y: "20", className: "text-gray-400 font-bold text-sm", children: "InnovateInc" }) })
  }
];
function ReviewSlideSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollTo = useCallback((index) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);
  useEffect(() => {
    const autoSlide = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 5e3);
    return () => clearInterval(autoSlide);
  }, [emblaApi]);
  return /* @__PURE__ */ jsxs("section", { className: "py-24 bg-white relative overflow-hidden", id: "testimonials", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -left-40 -bottom-40 w-80 h-80 bg-[#7C3AED]/5 rounded-full blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-60 h-60 bg-[#6EE7B7]/5 rounded-full blur-3xl" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.6 },
          className: "text-center mb-16",
          children: [
            /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-6", children: "Trusted by Industry Leaders" }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Hear from technical leaders about their experience working with Harun." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-white to-transparent z-10" }),
        /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-white to-transparent z-10" }),
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden", ref: emblaRef, children: /* @__PURE__ */ jsx("div", { className: "flex", children: reviews.map((review, index) => /* @__PURE__ */ jsx("div", { className: "flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_50%]", children: /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6, delay: index * 0.2 },
            children: /* @__PURE__ */ jsxs(Card$1, { className: "relative p-6 h-full bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300", children: [
              /* @__PURE__ */ jsx("div", { className: "flex mb-6", children: [...Array(review.rating)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "w-5 h-5 text-yellow-400 fill-current" }, i)) }),
              /* @__PURE__ */ jsxs("blockquote", { className: "text-lg text-gray-700 mb-8", children: [
                '"',
                review.content,
                '"'
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: review.image,
                    alt: review.author,
                    className: "w-14 h-14 rounded-full object-cover bg-gray-50"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("cite", { className: "not-italic font-semibold text-gray-900 block", children: review.author }),
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600 text-sm", children: review.position })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "absolute top-6 right-6", children: review.companyLogo })
            ] })
          }
        ) }, review.id)) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-center mt-8 gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => scrollTo(selectedIndex - 1), className: "p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => scrollTo(selectedIndex + 1), className: "p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors", children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-6 h-6" }) })
      ] }),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.6, delay: 0.4 },
          className: "mt-16 flex flex-wrap justify-center gap-8 md:gap-16",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold text-[#7C3AED] mb-2", children: "120+" }),
              /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Happy Clients" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold text-[#7C3AED] mb-2", children: "4.9/5" }),
              /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Average Rating" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold text-[#7C3AED] mb-2", children: "98%" }),
              /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Success Rate" })
            ] })
          ]
        }
      )
    ] })
  ] });
}
function Homepage() {
  return /* @__PURE__ */ jsxs(ErrorBoundary, { children: [
    /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("title", { children: "Harun R. Rayhan - Senior Software Engineer & DevOps Consultant" }) }),
    /* @__PURE__ */ jsxs("main", { className: "min-h-screen font-sans", children: [
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Menubar, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(HeroSectionV2, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(LogoSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(SkillsSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(TechStackSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(ReviewSlideSection, {}) }),
      /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(Footer, {}) })
    ] })
  ] });
}
const __vite_glob_0_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Homepage
}, Symbol.toStringTag, { value: "Module" }));
function DangerButton({
  className = "",
  disabled,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      ...props,
      className: `inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700 ${disabled && "opacity-25"} ` + className,
      disabled,
      children
    }
  );
}
function Modal({
  children,
  show = false,
  maxWidth = "2xl",
  closeable = true,
  onClose = () => {
  }
}) {
  const close = () => {
    if (closeable) {
      onClose();
    }
  };
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl"
  }[maxWidth];
  return /* @__PURE__ */ jsx(Transition, { show, leave: "duration-200", children: /* @__PURE__ */ jsxs(
    Dialog,
    {
      as: "div",
      id: "modal",
      className: "fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0",
      onClose: close,
      children: [
        /* @__PURE__ */ jsx(
          TransitionChild,
          {
            enter: "ease-out duration-300",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "ease-in duration-200",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gray-500/75" })
          }
        ),
        /* @__PURE__ */ jsx(
          TransitionChild,
          {
            enter: "ease-out duration-300",
            enterFrom: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            enterTo: "opacity-100 translate-y-0 sm:scale-100",
            leave: "ease-in duration-200",
            leaveFrom: "opacity-100 translate-y-0 sm:scale-100",
            leaveTo: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
            children: /* @__PURE__ */ jsx(
              DialogPanel,
              {
                className: `mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full ${maxWidthClass}`,
                children
              }
            )
          }
        )
      ]
    }
  ) });
}
function SecondaryButton({
  type = "button",
  className = "",
  disabled,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      ...props,
      type,
      className: `inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 ${disabled && "opacity-25"} ` + className,
      disabled,
      children
    }
  );
}
function DeleteUserForm({
  className = ""
}) {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef(null);
  const {
    data,
    setData,
    delete: destroy,
    processing,
    reset,
    errors,
    clearErrors
  } = useForm({
    password: ""
  });
  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };
  const deleteUser = (e) => {
    e.preventDefault();
    destroy(route("profile.destroy"), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => {
        var _a;
        return (_a = passwordInput.current) == null ? void 0 : _a.focus();
      },
      onFinish: () => reset()
    });
  };
  const closeModal = () => {
    setConfirmingUserDeletion(false);
    clearErrors();
    reset();
  };
  return /* @__PURE__ */ jsxs("section", { className: `space-y-6 ${className}`, children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Delete Account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain." })
    ] }),
    /* @__PURE__ */ jsx(DangerButton, { onClick: confirmUserDeletion, children: "Delete Account" }),
    /* @__PURE__ */ jsx(Modal, { show: confirmingUserDeletion, onClose: closeModal, children: /* @__PURE__ */ jsxs("form", { onSubmit: deleteUser, className: "p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Are you sure you want to delete your account?" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsx(
          InputLabel,
          {
            htmlFor: "password",
            value: "Password",
            className: "sr-only"
          }
        ),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            type: "password",
            name: "password",
            ref: passwordInput,
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            className: "mt-1 block w-3/4",
            isFocused: true,
            placeholder: "Password"
          }
        ),
        /* @__PURE__ */ jsx(
          InputError,
          {
            message: errors.password,
            className: "mt-2"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end", children: [
        /* @__PURE__ */ jsx(SecondaryButton, { onClick: closeModal, children: "Cancel" }),
        /* @__PURE__ */ jsx(DangerButton, { className: "ms-3", disabled: processing, children: "Delete Account" })
      ] })
    ] }) })
  ] });
}
const __vite_glob_0_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DeleteUserForm
}, Symbol.toStringTag, { value: "Module" }));
function UpdatePasswordForm({
  className = ""
}) {
  const passwordInput = useRef(null);
  const currentPasswordInput = useRef(null);
  const {
    data,
    setData,
    errors,
    put,
    reset,
    processing,
    recentlySuccessful
  } = useForm({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const updatePassword = (e) => {
    e.preventDefault();
    put(route("password.update"), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors2) => {
        var _a, _b;
        if (errors2.password) {
          reset("password", "password_confirmation");
          (_a = passwordInput.current) == null ? void 0 : _a.focus();
        }
        if (errors2.current_password) {
          reset("current_password");
          (_b = currentPasswordInput.current) == null ? void 0 : _b.focus();
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs("section", { className, children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Update Password" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Ensure your account is using a long, random password to stay secure." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: updatePassword, className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          InputLabel,
          {
            htmlFor: "current_password",
            value: "Current Password"
          }
        ),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "current_password",
            ref: currentPasswordInput,
            value: data.current_password,
            onChange: (e) => setData("current_password", e.target.value),
            type: "password",
            className: "mt-1 block w-full",
            autoComplete: "current-password"
          }
        ),
        /* @__PURE__ */ jsx(
          InputError,
          {
            message: errors.current_password,
            className: "mt-2"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "password", value: "New Password" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password",
            ref: passwordInput,
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            type: "password",
            className: "mt-1 block w-full",
            autoComplete: "new-password"
          }
        ),
        /* @__PURE__ */ jsx(InputError, { message: errors.password, className: "mt-2" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          InputLabel,
          {
            htmlFor: "password_confirmation",
            value: "Confirm Password"
          }
        ),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "password_confirmation",
            value: data.password_confirmation,
            onChange: (e) => setData("password_confirmation", e.target.value),
            type: "password",
            className: "mt-1 block w-full",
            autoComplete: "new-password"
          }
        ),
        /* @__PURE__ */ jsx(
          InputError,
          {
            message: errors.password_confirmation,
            className: "mt-2"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(PrimaryButton, { disabled: processing, children: "Save" }),
        /* @__PURE__ */ jsx(
          Transition,
          {
            show: recentlySuccessful,
            enter: "transition ease-in-out",
            enterFrom: "opacity-0",
            leave: "transition ease-in-out",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Saved." })
          }
        )
      ] })
    ] })
  ] });
}
const __vite_glob_0_13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: UpdatePasswordForm
}, Symbol.toStringTag, { value: "Module" }));
function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = ""
}) {
  const user = usePage().props.auth.user;
  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name: user.name,
    email: user.email
  });
  const submit = (e) => {
    e.preventDefault();
    patch(route("profile.update"));
  };
  return /* @__PURE__ */ jsxs("section", { className, children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Profile Information" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Update your account's profile information and email address." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "name", value: "Name" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "name",
            className: "mt-1 block w-full",
            value: data.name,
            onChange: (e) => setData("name", e.target.value),
            required: true,
            isFocused: true,
            autoComplete: "name"
          }
        ),
        /* @__PURE__ */ jsx(InputError, { className: "mt-2", message: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(InputLabel, { htmlFor: "email", value: "Email" }),
        /* @__PURE__ */ jsx(
          TextInput,
          {
            id: "email",
            type: "email",
            className: "mt-1 block w-full",
            value: data.email,
            onChange: (e) => setData("email", e.target.value),
            required: true,
            autoComplete: "username"
          }
        ),
        /* @__PURE__ */ jsx(InputError, { className: "mt-2", message: errors.email })
      ] }),
      mustVerifyEmail && user.email_verified_at === null && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-800", children: [
          "Your email address is unverified.",
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("verification.send"),
              method: "post",
              as: "button",
              className: "rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
              children: "Click here to re-send the verification email."
            }
          )
        ] }),
        status === "verification-link-sent" && /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm font-medium text-green-600", children: "A new verification link has been sent to your email address." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(PrimaryButton, { disabled: processing, children: "Save" }),
        /* @__PURE__ */ jsx(
          Transition,
          {
            show: recentlySuccessful,
            enter: "transition ease-in-out",
            enterFrom: "opacity-0",
            leave: "transition ease-in-out",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Saved." })
          }
        )
      ] })
    ] })
  ] });
}
const __vite_glob_0_14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: UpdateProfileInformation
}, Symbol.toStringTag, { value: "Module" }));
function Edit({
  mustVerifyEmail,
  status
}) {
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold leading-tight text-gray-800", children: "Profile" }),
      children: [
        /* @__PURE__ */ jsx(Head, { title: "Profile" }),
        /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-white p-4 shadow sm:rounded-lg sm:p-8", children: /* @__PURE__ */ jsx(
            UpdateProfileInformation,
            {
              mustVerifyEmail,
              status,
              className: "max-w-xl"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white p-4 shadow sm:rounded-lg sm:p-8", children: /* @__PURE__ */ jsx(UpdatePasswordForm, { className: "max-w-xl" }) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white p-4 shadow sm:rounded-lg sm:p-8", children: /* @__PURE__ */ jsx(DeleteUserForm, { className: "max-w-xl" }) })
        ] }) })
      ]
    }
  );
}
const __vite_glob_0_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Edit
}, Symbol.toStringTag, { value: "Module" }));
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("flex flex-col space-y-1.5 p-6", className),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "h3",
    {
      className: cn("font-semibold leading-none tracking-tight text-xl", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "p",
    {
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("p-6 pt-0", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("flex items-center p-6 pt-0", className),
      ...props
    }
  );
}
const services = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description: "Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs.",
    link: "/services/cloud-architecture"
  },
  {
    icon: Code,
    title: "DevOps Implementation",
    description: "Streamline your development and operations with cutting-edge DevOps practices and tools.",
    link: "/services/devops"
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Implement and manage your infrastructure using modern IaC tools like Terraform and AWS CDK.",
    link: "/services/infrastructure-as-code"
  },
  {
    icon: Cloud,
    title: "Serverless Infrastructure",
    description: "Design and implement scalable serverless solutions to reduce operational overhead and costs.",
    link: "/services/serverless-infrastructure"
  },
  {
    icon: Zap,
    title: "Automated Deployment (CI/CD)",
    description: "Implement efficient CI/CD pipelines for faster, more reliable software delivery and deployment processes.",
    link: "/services/automated-deployment"
  },
  {
    icon: Lock,
    title: "Security Consulting",
    description: "Enhance your cloud and application security with expert consulting and implementation services.",
    link: "/services/security-consulting"
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Boost your application and infrastructure performance with expert analysis and optimization techniques.",
    link: "/services/performance-optimization"
  },
  {
    icon: ArrowRightLeft,
    title: "Infrastructure Migration",
    description: "Seamlessly migrate your infrastructure to modern, scalable platforms with minimal downtime.",
    link: "/services/infrastructure-migration"
  },
  {
    icon: Brain,
    title: "MLOps (AI/ML Infrastructure)",
    description: "Build and manage robust infrastructure for AI/ML workflows, from development to production.",
    link: "/services/mlops"
  },
  {
    icon: Database,
    title: "Database Migration",
    description: "Migrate your databases to modern platforms while ensuring data integrity and minimal disruption.",
    link: "/services/database-migration"
  },
  // {
  //     icon: Network,
  //     title: "Network Optimization",
  //     description: "Enhance your network infrastructure for improved performance, security, and reliability.",
  //     link: "/services/network-optimization",
  // },
  {
    icon: MonitorSmartphone,
    title: "Monitoring and Observability",
    description: "Implement comprehensive monitoring and observability solutions for your entire stack.",
    link: "/services/monitoring-observability"
  },
  {
    icon: Database,
    title: "Database Optimization",
    description: "Optimize your database performance, security, and scalability for improved application responsiveness.",
    link: "/services/database-optimization"
  }
];
const faqs = [
  {
    question: "What cloud platforms do you specialize in?",
    answer: "We specialize in AWS (Amazon Web Services), but also have expertise in other major cloud platforms such as Microsoft Azure and Google Cloud Platform. Our team is certified in multiple AWS domains, ensuring we can provide comprehensive solutions across the entire AWS ecosystem."
  },
  {
    question: "How can DevOps practices benefit my business?",
    answer: "DevOps practices can significantly benefit your business by improving collaboration between development and operations teams, accelerating software delivery, increasing reliability, and reducing time-to-market. Our DevOps implementation services focus on automating processes, implementing continuous integration and delivery (CI/CD), and fostering a culture of shared responsibility and continuous improvement."
  },
  {
    question: "What types of database optimization services do you offer?",
    answer: "Our database optimization services cover a wide range of areas including query performance tuning, indexing strategies, data modeling, replication setup, and scalability planning. We work with various database systems including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB and DynamoDB."
  },
  {
    question: "How do you approach cloud security in your projects?",
    answer: "We take a comprehensive approach to cloud security, incorporating best practices at every level of the stack. This includes implementing robust identity and access management (IAM) policies, encrypting data at rest and in transit, setting up virtual private clouds (VPCs) with proper network segmentation, and utilizing cloud-native security services. We also conduct regular security audits and help implement compliance frameworks like GDPR, HIPAA, and PCI-DSS."
  },
  {
    question: "What is Infrastructure as Code (IaC) and why is it important?",
    answer: "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It's important because it allows for consistent, version-controlled, and repeatable infrastructure deployments, reducing human error and increasing efficiency. We specialize in tools like Terraform and AWS CloudFormation to implement IaC solutions."
  },
  {
    question: "How can your performance optimization services improve my application?",
    answer: "Our performance optimization services can improve your application in several ways. We conduct thorough performance audits to identify bottlenecks, optimize database queries and application code, implement caching strategies, and fine-tune server configurations. We also leverage cloud services for auto-scaling and load balancing to ensure your application performs well under varying loads. The result is faster response times, improved user experience, and more efficient resource utilization."
  }
];
function ServicesPage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Services" }),
    /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsx(Menubar, {}),
      /* @__PURE__ */ jsx("section", { className: "py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
            className: "w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6",
            children: /* @__PURE__ */ jsx(Grid, { className: "w-8 h-8 text-white" })
          }
        ),
        /* @__PURE__ */ jsx(
          motion.h1,
          {
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.1 },
            className: "text-4xl md:text-5xl font-bold text-white mb-6",
            children: "Our Services"
          }
        ),
        /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.2 },
            className: "text-xl text-white/90 max-w-3xl mx-auto",
            children: "Elevate your business with our comprehensive range of software engineering and cloud services."
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "py-24 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: services.map((service, index) => /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center mb-4",
                children: /* @__PURE__ */ jsx(service.icon, { className: "w-6 h-6 text-[#7C3AED]" })
              }
            ),
            /* @__PURE__ */ jsx(CardTitle, { children: service.title }),
            /* @__PURE__ */ jsx(CardDescription, { children: service.description })
          ] }),
          /* @__PURE__ */ jsx(CardFooter, { className: "mt-auto", children: /* @__PURE__ */ jsx(Link, { href: service.link, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full", children: [
            "Learn More",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] }) }) })
        ] }, index)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-16 text-center", children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "lg",
            className: "bg-white text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white border-[#7C3AED] transition-all duration-300",
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "w-5 h-5 mr-2" }),
              "Is the service you're looking for missing? We might do it. Send us a message."
            ]
          }
        ) }) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "py-24 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center", children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: faqs.map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index}`, children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left", children: faq.question }),
          /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
}
const __vite_glob_0_15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ServicesPage
}, Symbol.toStringTag, { value: "Module" }));
function ServiceHero({ icon: Icon, title, description }) {
  return /* @__PURE__ */ jsx("section", { className: "py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        className: "w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6",
        children: /* @__PURE__ */ jsx(Icon, { className: "w-8 h-8 text-white" })
      }
    ),
    /* @__PURE__ */ jsx(
      motion.h1,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.1 },
        className: "text-4xl md:text-5xl font-bold text-white mb-6",
        children: title
      }
    ),
    /* @__PURE__ */ jsx(
      motion.p,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.2 },
        className: "text-xl text-white/90 max-w-3xl mx-auto",
        children: description
      }
    )
  ] }) });
}
function InfiniteScrollTech({ technologies: technologies2, backgroundColor = "#F8F9FA" }) {
  return /* @__PURE__ */ jsxs("section", { className: `py-24 overflow-hidden`, style: { backgroundColor }, children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" },
        viewport: { once: true },
        className: "container mx-auto px-4 text-center mb-12",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Technologies We Use" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "We leverage industry-leading platforms and tools to build scalable solutions." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx("div", { className: `absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[${backgroundColor}] to-transparent z-10` }),
      /* @__PURE__ */ jsx("div", { className: `absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[${backgroundColor}] to-transparent z-10` }),
      /* @__PURE__ */ jsx("div", { className: "flex overflow-hidden", children: /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { x: 0 },
          animate: { x: "-50%" },
          transition: {
            duration: 120,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear"
          },
          className: "flex items-center space-x-16 whitespace-nowrap py-8",
          children: technologies2.concat(technologies2).map((tech, index) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110",
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: tech.logo || "/placeholder.svg",
                    alt: `${tech.name} logo`,
                    width: 64,
                    height: 64,
                    className: "w-16 h-16 object-contain"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-600", children: tech.name })
              ] })
            },
            `${tech.name}-${index}`
          ))
        }
      ) })
    ] })
  ] });
}
const technologies$b = [
  {
    name: "Jenkins",
    logo: "https://www.jenkins.io/images/logos/jenkins/jenkins.png"
  },
  {
    name: "GitLab CI",
    logo: "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg"
  },
  {
    name: "GitHub Actions",
    logo: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg"
  },
  {
    name: "CircleCI",
    logo: "https://d3r49iyjzglexf.cloudfront.net/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png"
  },
  {
    name: "Travis CI",
    logo: "https://travis-ci.org/images/logos/TravisCI-Full-Color.png"
  },
  {
    name: "AWS CodePipeline",
    logo: "https://d1.awsstatic.com/icons/console_codepipeline_icon.0c5de384dc60b71dae9d780b0c572d5deb9e3f0a.png"
  },
  {
    name: "Azure DevOps",
    logo: "https://azure.microsoft.com/svghandler/devops/?width=300&height=300"
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/sites/default/files/d8/2019-07/vertical-logo-monochromatic.png"
  },
  {
    name: "Kubernetes",
    logo: "https://kubernetes.io/images/favicon.png"
  },
  {
    name: "Ansible",
    logo: "https://www.ansible.com/hubfs/2016_Images/Assets/Ansible-Mark-Large-RGB-Mango.png"
  },
  {
    name: "Terraform",
    logo: "https://www.terraform.io/img/logo-hashicorp.svg"
  }
];
const fadeInUp$b = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$b = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function AutomatedDeployment() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Zap,
        title: "Automated Deployment (CI/CD)",
        description: "Implement efficient CI/CD pipelines for faster, more reliable software delivery and deployment processes."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$b, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$b, children: "Our Automated Deployment Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: GitBranch,
          title: "Continuous Integration",
          content: "Set up automated build and test processes to catch issues early and improve code quality."
        },
        {
          icon: Zap,
          title: "Continuous Delivery",
          content: "Automate the deployment process to ensure reliable and consistent releases to production environments."
        },
        {
          icon: Repeat,
          title: "Pipeline Optimization",
          content: "Continuously improve your CI/CD pipelines for faster builds, deployments, and more efficient workflows."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$b, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$b, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$b, children: "Why Choose Us for Automated Deployment" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Tool Expertise",
          content: "We have deep expertise in a wide range of CI/CD tools and can help you choose and implement the best solution for your needs."
        },
        {
          title: "Custom Workflows",
          content: "We design and implement custom CI/CD workflows tailored to your specific development and deployment processes."
        },
        {
          title: "Security Integration",
          content: "We integrate security checks and compliance measures into your CI/CD pipeline to ensure secure deployments."
        },
        {
          title: "Scalable Solutions",
          content: "Our CI/CD implementations are designed to scale with your organization, handling increased complexity and volume over time."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$b, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$b, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$b, children: "Our Automated Deployment Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: BarChart,
          title: "1. Assessment",
          content: "We evaluate your current development and deployment processes to identify areas for automation and improvement."
        },
        {
          icon: Code,
          title: "2. Design",
          content: "We design a CI/CD pipeline tailored to your specific needs and technology stack."
        },
        {
          icon: Cloud,
          title: "3. Implementation",
          content: "We set up and configure the chosen CI/CD tools and integrate them with your existing systems."
        },
        {
          icon: Users,
          title: "4. Training & Support",
          content: "We provide comprehensive training and ongoing support to ensure successful adoption of CI/CD practices."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$b, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$b, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$b, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$b, children: "Ready to automate your deployment process?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$b, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$b, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$b, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$b, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What is CI/CD and why is it important?",
          answer: "CI/CD stands for Continuous Integration and Continuous Delivery/Deployment. It's a set of practices that automate the process of building, testing, and deploying software. CI/CD is important because it helps teams deliver high-quality software faster and more reliably, reducing the risk of errors and improving overall efficiency."
        },
        {
          question: "How long does it take to implement a CI/CD pipeline?",
          answer: "The time to implement a CI/CD pipeline can vary depending on the complexity of your project and your current infrastructure. A basic pipeline can be set up in a few days, while more complex setups might take a few weeks. We work closely with your team to ensure a smooth implementation and knowledge transfer throughout the process."
        },
        {
          question: "Can you integrate CI/CD with our existing tools and workflows?",
          answer: "Yes, we design CI/CD pipelines to integrate seamlessly with your existing tools and workflows. Whether you're using specific version control systems, project management tools, or deployment environments, we can create a pipeline that fits into your current processes while improving efficiency and reliability."
        },
        {
          question: "How do you ensure security in CI/CD pipelines?",
          answer: "Security is a crucial aspect of our CI/CD implementations. We incorporate security best practices such as secret management, access control, and vulnerability scanning into the pipeline. We also integrate security testing tools to catch potential issues early in the development process and ensure that only approved, secure code makes it to production."
        },
        {
          question: "What are the benefits of automated deployment?",
          answer: "Automated deployment offers numerous benefits, including: 1) Faster and more frequent releases, 2) Reduced human error in the deployment process, 3) Consistent and repeatable deployments across different environments, 4) Easier rollbacks in case of issues, 5) Improved collaboration between development and operations teams, and 6) More time for developers to focus on building features rather than managing deployments."
        },
        {
          question: "How do you handle database changes in CI/CD pipelines?",
          answer: "Handling database changes in CI/CD pipelines is crucial for maintaining data integrity and ensuring smooth deployments. We typically use database migration tools that can be integrated into the CI/CD process. These tools allow version control of database schemas and data, automated testing of migrations, and rollback capabilities. We also implement strategies like blue-green deployments or canary releases to minimize downtime and risk when deploying database changes."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: AutomatedDeployment
}, Symbol.toStringTag, { value: "Module" }));
const technologies$a = [
  { name: "AWS", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
  { name: "Azure", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg" },
  { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
  },
  { name: "Docker", logo: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" },
  { name: "Terraform", logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg" },
  { name: "Ansible", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Ansible_logo.svg" },
  { name: "Jenkins", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg" }
];
const fadeInUp$a = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$a = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function CloudArchitecturePage() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Cloud Architecture" }),
    /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsx(Menubar, {}),
      /* @__PURE__ */ jsx(
        ServiceHero,
        {
          icon: Cloud,
          title: "Cloud Architecture",
          description: "Design and implement scalable, secure, and cost-effective cloud solutions tailored to your business needs."
        }
      ),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$a, children: "Our Cloud Architecture Services" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
          {
            icon: Cloud,
            title: "Scalable Infrastructure",
            content: "Design cloud architectures that can seamlessly scale to meet your growing business demands."
          },
          {
            icon: Server,
            title: "Cost Optimization",
            content: "Implement strategies to optimize cloud costs while maintaining high performance and reliability."
          },
          {
            icon: Lock,
            title: "Security-First Design",
            content: "Ensure your cloud architecture adheres to best security practices and compliance requirements."
          }
        ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$a, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: service.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: service.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$a, children: "Why Choose Us for Cloud Architecture" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
          {
            title: "Expertise Across Major Cloud Platforms",
            content: "Our team is certified in AWS, Azure, and Google Cloud, ensuring we can design the best solution for your needs."
          },
          {
            title: "Tailored Solutions",
            content: "We design cloud architectures that are specifically tailored to your business goals and requirements."
          },
          {
            title: "Focus on Security and Compliance",
            content: "We prioritize security and ensure your cloud architecture meets all necessary compliance standards."
          },
          {
            title: "Continuous Optimization",
            content: "We don't just set it and forget it. We continuously monitor and optimize your cloud architecture for peak performance and cost-efficiency."
          }
        ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$a, children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
            /* @__PURE__ */ jsx("p", { children: item.content })
          ] })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$a, children: "Our Cloud Architecture Process" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
          {
            icon: BarChart,
            title: "1. Assessment",
            content: "We begin by thoroughly assessing your current infrastructure and business needs."
          },
          {
            icon: Cloud,
            title: "2. Design",
            content: "Our experts design a cloud architecture tailored to your specific requirements."
          },
          {
            icon: Server,
            title: "3. Implementation",
            content: "We implement the designed architecture with a focus on security and scalability."
          },
          {
            icon: Users,
            title: "4. Support & Optimization",
            content: "We provide ongoing support and continuously optimize your cloud infrastructure."
          }
        ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$a, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: step.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: step.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$a, children: "Industries We Serve" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8", children: [
          { name: "Finance", icon: Landmark },
          { name: "Healthcare", icon: Stethoscope },
          { name: "E-commerce", icon: ShoppingCart },
          { name: "Education", icon: GraduationCap },
          { name: "Manufacturing", icon: Factory },
          { name: "Media", icon: Film }
        ].map((industry, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex flex-col items-center", variants: fadeInUp$a, children: [
          /* @__PURE__ */ jsx(industry.icon, { className: "w-12 h-12 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-center", children: industry.name })
        ] }, industry.name)) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { ref: sectionRef, className: "py-24 bg-[#F8F9FA] overflow-hidden", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 50 },
            animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
            transition: { duration: 0.8, ease: "easeOut" },
            className: "container mx-auto px-4 text-center mb-12",
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Technologies We Use" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "Proficient in a wide range of modern cloud and DevOps technologies." })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { x: 0 },
              animate: { x: "-50%" },
              transition: {
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
              },
              whileHover: { scale: 1.1 },
              className: "group flex items-center space-x-16 whitespace-nowrap py-8",
              children: technologies$a.concat(technologies$a).map((tech, index) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex-shrink-0 h-20 w-[200px] transition-all duration-300 group-hover:scale-110",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: tech.logo || "/placeholder.svg",
                        alt: `${tech.name} logo`,
                        className: "w-16 h-16 object-contain"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-600", children: tech.name })
                  ] })
                },
                `${tech.name}-${index}`
              ))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$a, children: "Ready to optimize your cloud architecture?" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$a, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
          "Get Started",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$a, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$a, children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$a, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
          {
            question: "What cloud platforms do you work with?",
            answer: "We primarily work with AWS (Amazon Web Services), but we also have expertise in Microsoft Azure and Google Cloud Platform. Our team can help you choose the best cloud platform for your specific needs and requirements."
          },
          {
            question: "How do you ensure scalability in cloud architecture?",
            answer: "We design cloud architectures with scalability in mind from the ground up. This includes using auto-scaling groups, load balancers, and serverless technologies where appropriate. We also implement best practices for database scaling and caching to ensure your application can handle increased loads seamlessly."
          },
          {
            question: "Can you help with cloud migration?",
            answer: "Yes, we offer comprehensive cloud migration services. We'll assess your current infrastructure, develop a migration strategy, and execute the migration with minimal downtime. Our approach ensures data integrity and maintains business continuity throughout the process."
          },
          {
            question: "How do you address security concerns in cloud architecture?",
            answer: "Security is a top priority in our cloud architecture designs. We implement best practices such as encryption at rest and in transit, identity and access management (IAM), network segmentation, and regular security audits. We also ensure compliance with relevant industry standards and regulations."
          },
          {
            question: "What's your approach to cost optimization in cloud architecture?",
            answer: "We take a proactive approach to cost optimization. This includes right-sizing resources, leveraging reserved instances or savings plans, implementing auto-scaling to match demand, and using cost allocation tags. We also provide ongoing monitoring and recommendations to ensure your cloud spend remains optimized as your needs evolve."
          }
        ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
          /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
        ] }, index)) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
}
const __vite_glob_0_17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: CloudArchitecturePage
}, Symbol.toStringTag, { value: "Module" }));
const technologies$9 = [
  { name: "MySQL", logo: "https://www.mysql.com/common/logos/logo-mysql-170x115.png" },
  { name: "PostgreSQL", logo: "https://www.postgresql.org/media/img/about/press/elephant.png" },
  { name: "MongoDB", logo: "https://www.mongodb.com/assets/images/global/leaf.png" },
  { name: "Oracle", logo: "https://www.oracle.com/a/ocom/img/rh03-oracle-logo.png" },
  { name: "Microsoft SQL Server", logo: "https://www.microsoft.com/en-us/sql-server/img/sql-server-logo.png" },
  {
    name: "Amazon RDS",
    logo: "https://d1.awsstatic.com/rdsImages/hp_schema%402x.b509be7f0e26575880dbd3f100d2d9fc3585ef14.png"
  },
  {
    name: "Google Cloud SQL",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg"
  },
  {
    name: "Azure SQL Database",
    logo: "https://azurecomcdn.azureedge.net/cvt-fe62df23db878c43b28b61c1015349635dc17981d8a7e21e3958a2c0753e4957/svg/azure.svg"
  }
];
const fadeInUp$9 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$9 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function DatabaseMigration() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Database,
        title: "Database Migration",
        description: "Migrate your databases to modern platforms while ensuring data integrity and minimal disruption."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$9, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$9, children: "Our Database Migration Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Database,
          title: "Database Assessment",
          content: "Thoroughly assess your current database architecture and develop a tailored migration strategy."
        },
        {
          icon: ArrowRightLeft,
          title: "Data Migration",
          content: "Securely migrate your data to the new database platform with minimal downtime and data loss risk."
        },
        {
          icon: Shield,
          title: "Post-Migration Support",
          content: "Provide ongoing support and optimization to ensure smooth operation of your new database environment."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$9, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$9, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$9, children: "Why Choose Us for Database Migration" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Expertise Across Database Platforms",
          content: "Our team has experience migrating various types of databases, including relational and NoSQL systems."
        },
        {
          title: "Minimal Downtime",
          content: "We use advanced migration techniques to minimize disruption to your business operations."
        },
        {
          title: "Data Integrity Assurance",
          content: "We implement rigorous validation processes to ensure data accuracy and completeness during migration."
        },
        {
          title: "Performance Optimization",
          content: "We optimize your database structure and queries for improved performance in the new environment."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$9, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$9, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$9, children: "Our Database Migration Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: Database,
          title: "1. Assessment",
          content: "We assess your current database architecture and develop a comprehensive migration plan."
        },
        {
          icon: Cloud,
          title: "2. Preparation",
          content: "We prepare the target environment and set up necessary tools for the migration process."
        },
        {
          icon: ArrowRightLeft,
          title: "3. Migration",
          content: "We execute the migration, ensuring data integrity and minimal disruption to your operations."
        },
        {
          icon: BarChart,
          title: "4. Validation & Optimization",
          content: "We validate the migrated data and optimize the new database environment for peak performance."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$9, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$9, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$9, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$9, children: "Ready to migrate your database?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$9, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$9, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$9, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$9, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "Why should I consider database migration?",
          answer: "Database migration can offer numerous benefits, including improved performance, scalability, and cost-efficiency. It can also provide access to new features and capabilities, better security, and easier maintenance. If your current database is struggling to meet your needs or if you're looking to modernize your infrastructure, database migration might be the right choice."
        },
        {
          question: "How do you ensure data integrity during migration?",
          answer: "Ensuring data integrity is our top priority during migration. We use a combination of techniques, including thorough pre-migration testing, data validation checks, and post-migration reconciliation. We also implement robust error handling and rollback procedures. Where possible, we use tools that provide checksums or other integrity verification methods to ensure that every piece of data is accurately transferred."
        },
        {
          question: "How do you minimize downtime during database migration?",
          answer: "We employ several strategies to minimize downtime, depending on your specific needs and constraints. These may include using replication to keep the old and new databases in sync during migration, performing the migration in phases, or using 'zero-downtime' migration techniques where possible. In cases where some downtime is unavoidable, we carefully plan the migration to occur during off-peak hours to minimize disruption."
        },
        {
          question: "Can you migrate between different types of databases?",
          answer: "Yes, we can handle migrations between different types of databases, often referred to as heterogeneous migrations. This could involve moving from a relational database to a NoSQL database, or between different relational database management systems (e.g., from Oracle to PostgreSQL). These migrations often involve schema conversion and data transformation, which we carefully plan and execute to ensure compatibility and optimal performance in the new environment."
        },
        {
          question: "How do you handle large-scale database migrations?",
          answer: "For large-scale migrations, we employ a variety of techniques to ensure efficiency and reliability. This may include parallel processing to speed up data transfer, incremental migration approaches to reduce risk, and specialized tools designed for handling large volumes of data. We also pay special attention to performance optimization both during and after the migration to ensure that the new database can handle the large-scale data effectively."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DatabaseMigration
}, Symbol.toStringTag, { value: "Module" }));
const technologies$8 = [
  {
    name: "MySQL",
    logo: "https://www.mysql.com/common/logos/logo-mysql-170x115.png"
  },
  {
    name: "PostgreSQL",
    logo: "https://www.postgresql.org/media/img/about/press/elephant.png"
  },
  {
    name: "MongoDB",
    logo: "https://www.mongodb.com/assets/images/global/leaf.png"
  },
  {
    name: "Oracle",
    logo: "https://www.oracle.com/a/ocom/img/rh03-oracle-logo.png"
  },
  {
    name: "Microsoft SQL Server",
    logo: "https://www.microsoft.com/en-us/sql-server/img/sql-server-logo.png"
  },
  {
    name: "Redis",
    logo: "https://redis.io/images/redis-white.png"
  },
  {
    name: "Elasticsearch",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt36f2da8d650732a0/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg"
  },
  {
    name: "Cassandra",
    logo: "https://cassandra.apache.org/_/img/cassandra_logo.svg"
  },
  {
    name: "Amazon RDS",
    logo: "https://d1.awsstatic.com/rdsImages/hp_schema%402x.b509be7f0e26575880dbd3f100d2d9fc3585ef14.png"
  },
  {
    name: "Google Cloud SQL",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg"
  },
  {
    name: "Azure SQL Database",
    logo: "https://azurecomcdn.azureedge.net/cvt-fe62df23db878c43b28b61c1015349635dc17981d8a7e21e3958a2c0753e4957/svg/azure.svg"
  }
];
const fadeInUp$8 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$8 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function DatabaseOptimization() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Database,
        title: "Database Optimization",
        description: "Optimize your database performance, security, and scalability for improved application responsiveness."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$8, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$8, children: "Our Database Optimization Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Zap,
          title: "Performance Tuning",
          content: "Optimize queries, indexes, and database configurations to significantly improve response times."
        },
        {
          icon: Lock,
          title: "Security Enhancement",
          content: "Implement robust security measures to protect your data from unauthorized access and potential threats."
        },
        {
          icon: Database,
          title: "Scalability Planning",
          content: "Design and implement strategies to ensure your database can handle growing data volumes and user loads."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$8, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$8, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$8, children: "Why Choose Us for Database Optimization" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Expertise Across Database Systems",
          content: "Our team has deep knowledge of various database systems, ensuring optimal solutions for your specific setup."
        },
        {
          title: "Data-Driven Approach",
          content: "We use advanced analytics and monitoring tools to identify bottlenecks and optimize based on real usage patterns."
        },
        {
          title: "Holistic Optimization",
          content: "We consider all aspects of your database ecosystem, including hardware, software, and application layers."
        },
        {
          title: "Continuous Improvement",
          content: "We implement ongoing monitoring and optimization processes to ensure sustained performance over time."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$8, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$8, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$8, children: "Our Database Optimization Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: BarChart,
          title: "1. Assessment",
          content: "We thoroughly analyze your current database performance, identifying bottlenecks and areas for improvement."
        },
        {
          icon: GitBranch,
          title: "2. Strategy Development",
          content: "We create a tailored optimization plan based on our assessment and your specific business needs."
        },
        {
          icon: Database,
          title: "3. Implementation",
          content: "We execute the optimization strategies, carefully monitoring the impact on your system."
        },
        {
          icon: Cloud,
          title: "4. Monitoring & Refinement",
          content: "We set up ongoing monitoring and continuously refine our optimizations to ensure sustained performance."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$8, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$8, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$8, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$8, children: "Ready to optimize your database performance?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$8, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$8, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$8, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$8, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What are the signs that my database needs optimization?",
          answer: "Common signs include slow query performance, high CPU or memory usage, frequent timeouts, and difficulty scaling to meet growing demands. If your application is experiencing slow response times or if you're seeing increased costs for database operations, it might be time for optimization."
        },
        {
          question: "How can database optimization improve my business operations?",
          answer: "Database optimization can significantly enhance your business operations by improving application performance, reducing response times, lowering infrastructure costs, and enabling your systems to handle larger data volumes and user loads. This leads to better user experience, increased productivity, and the ability to scale your business more effectively."
        },
        {
          question: "Do you work with both SQL and NoSQL databases?",
          answer: "Yes, we have expertise in optimizing both SQL databases (like MySQL, PostgreSQL, and SQL Server) and NoSQL databases (such as MongoDB, Cassandra, and Redis). Our team is well-versed in the unique characteristics and optimization strategies for various database systems."
        },
        {
          question: "How do you ensure data integrity during the optimization process?",
          answer: "Data integrity is our top priority during any optimization process. We use a combination of techniques including thorough testing in staging environments, implementing transactional processes where possible, and creating backups before making any significant changes. We also use monitoring tools to ensure that data remains consistent throughout the optimization process."
        },
        {
          question: "Can you help with database optimization in cloud environments?",
          answer: "Absolutely. We have extensive experience optimizing databases in various cloud environments, including AWS, Google Cloud, and Azure. We can help you leverage cloud-specific features and services to enhance your database performance, implement effective scaling strategies, and optimize costs in cloud settings."
        },
        {
          question: "How long does the database optimization process typically take?",
          answer: "The duration of the optimization process can vary depending on the size and complexity of your database, as well as the specific issues being addressed. A basic optimization might take a few days, while more complex projects could span several weeks. We always provide a detailed timeline and keep you updated throughout the process."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DatabaseOptimization
}, Symbol.toStringTag, { value: "Module" }));
const technologies$7 = [
  {
    name: "Jenkins",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg"
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png"
  },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
  },
  {
    name: "Terraform",
    logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg"
  },
  {
    name: "AWS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
  },
  {
    name: "GitHub Actions",
    logo: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg"
  },
  {
    name: "Ansible",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Ansible_logo.svg"
  },
  {
    name: "Prometheus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/Prometheus_software_logo.svg"
  },
  {
    name: "Grafana",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Grafana_icon.svg"
  },
  {
    name: "GitLab",
    logo: "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg"
  },
  {
    name: "Puppet",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Puppet_transparent_logo.svg"
  },
  {
    name: "Chef",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Chef_logo.svg"
  },
  {
    name: "Nagios",
    logo: "https://www.nagios.org/wp-content/uploads/2015/05/Nagios-Logo.jpg"
  },
  {
    name: "Splunk",
    logo: "https://www.splunk.com/content/dam/splunk-blogs/images/2017/02/splunk-logo.png"
  },
  {
    name: "ELK Stack",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt36f2da8d650732a0/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg"
  }
];
const fadeInUp$7 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$7 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function DevOpsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "DevOps Implementation" }),
    /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsx(Menubar, {}),
      /* @__PURE__ */ jsx(
        ServiceHero,
        {
          icon: Code,
          title: "DevOps Implementation",
          description: "Streamline your development and operations with cutting-edge DevOps practices and tools."
        }
      ),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$7, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$7, children: "Our DevOps Implementation Services" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
          {
            icon: GitBranch,
            title: "CI/CD Pipeline Setup",
            content: "Implement robust Continuous Integration and Continuous Deployment pipelines for faster, more reliable releases."
          },
          {
            icon: Code,
            title: "Infrastructure as Code",
            content: "Automate your infrastructure provisioning and management using tools like Terraform and Ansible."
          },
          {
            icon: Repeat,
            title: "Continuous Monitoring",
            content: "Set up comprehensive monitoring and alerting systems to ensure optimal performance and quick issue resolution."
          }
        ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$7, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: service.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: service.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$7, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$7, children: "Why Choose Us for DevOps Implementation" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
          {
            title: "Expertise Across Tools",
            content: "Our team is proficient in a wide range of DevOps tools and practices, ensuring the best fit for your needs."
          },
          {
            title: "Tailored Solutions",
            content: "We design DevOps implementations that are specifically tailored to your business goals and existing workflows."
          },
          {
            title: "Focus on Automation",
            content: "We prioritize automation to increase efficiency, reduce errors, and free up your team for more valuable tasks."
          },
          {
            title: "Continuous Improvement",
            content: "We implement feedback loops and metrics to ensure your DevOps practices evolve with your business needs."
          }
        ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$7, children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
            /* @__PURE__ */ jsx("p", { children: item.content })
          ] })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$7, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$7, children: "Our DevOps Implementation Process" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
          {
            icon: GitBranch,
            title: "1. Assessment",
            content: "We evaluate your current processes and identify areas for DevOps improvement."
          },
          {
            icon: Code,
            title: "2. Strategy",
            content: "We develop a tailored DevOps strategy aligned with your business objectives."
          },
          {
            icon: Repeat,
            title: "3. Implementation",
            content: "We implement DevOps practices and tools, focusing on automation and integration."
          },
          {
            icon: Users,
            title: "4. Training & Support",
            content: "We provide comprehensive training and ongoing support to ensure successful adoption."
          }
        ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$7, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: step.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: step.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { ref: sectionRef, className: "py-24 bg-[#F8F9FA] overflow-hidden", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 50 },
            animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
            transition: { duration: 0.8, ease: "easeOut" },
            className: "container mx-auto px-4 text-center mb-12",
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "DevOps Tools We Use" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "We leverage industry-leading tools to implement robust DevOps practices." })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { x: 0 },
              animate: { x: "-50%" },
              transition: {
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
              },
              className: "flex items-center space-x-16 whitespace-nowrap py-8",
              children: technologies$7.concat(technologies$7).map((tech, index) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: tech.logo || "/placeholder.svg",
                        alt: `${tech.name} logo`,
                        className: "w-16 h-16 object-contain"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-600", children: tech.name })
                  ] })
                },
                `${tech.name}-${index}`
              ))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$7, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$7, children: "Ready to implement DevOps in your organization?" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$7, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
          "Get Started",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$7, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$7, children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$7, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
          {
            question: "What DevOps tools do you use?",
            answer: "We use a wide range of DevOps tools, including but not limited to Jenkins, GitLab CI/CD, Docker, Kubernetes, Ansible, and Terraform. We'll help you choose and implement the best tools for your specific needs and existing technology stack."
          },
          {
            question: "How long does it take to implement DevOps practices?",
            answer: "The timeline for implementing DevOps practices varies depending on the size and complexity of your organization. Typically, initial implementation can take 3-6 months, with ongoing optimization and cultural shifts continuing beyond that. We'll work with you to create a tailored implementation plan."
          },
          {
            question: "How do you measure the success of DevOps implementation?",
            answer: "We measure success through various metrics, including deployment frequency, lead time for changes, mean time to recovery (MTTR), and change failure rate. We'll also look at team satisfaction and collaboration improvements. We'll work with you to establish baseline metrics and track improvements over time."
          },
          {
            question: "Can DevOps practices be implemented in a non-tech company?",
            answer: "While DevOps originated in the tech industry, its principles can be applied to any organization that develops or maintains software, regardless of the industry. We have experience implementing DevOps practices in various sectors, including finance, healthcare, and manufacturing."
          },
          {
            question: "How does DevOps impact security?",
            answer: "DevOps and security go hand-in-hand in what's often called DevSecOps. By integrating security practices into the DevOps workflow, we can improve your overall security posture. This includes implementing automated security testing, continuous monitoring, and rapid response to vulnerabilities. The result is a more secure development and deployment process."
          }
        ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
          /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
        ] }, index)) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
}
const __vite_glob_0_20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DevOpsPage
}, Symbol.toStringTag, { value: "Module" }));
const technologies$6 = [
  {
    name: "Terraform",
    logo: "https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg"
  },
  {
    name: "AWS CloudFormation",
    logo: "/images/logos/aws-cloudformation.svg"
  },
  {
    name: "AWS CDK",
    logo: "/images/logos/aws-cdk.svg"
  },
  {
    name: "Ansible",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Ansible_logo.svg"
  },
  {
    name: "Pulumi",
    logo: "https://www.pulumi.com/images/logo/logo-on-white.svg"
  },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png"
  },
  {
    name: "GitLab CI",
    logo: "https://about.gitlab.com/images/press/logo/svg/gitlab-icon-rgb.svg"
  },
  {
    name: "GitHub Actions",
    logo: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg"
  },
  {
    name: "Jenkins",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg"
  },
  {
    name: "Azure Resource Manager",
    logo: "https://azure.microsoft.com/svghandler/resource-manager/?width=300&height=300"
  }
];
const fadeInUp$6 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$6 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function InfrastructureAsCodePage() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Infrastructure as Code" }),
    /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsx(Menubar, {}),
      /* @__PURE__ */ jsx(
        ServiceHero,
        {
          icon: Server,
          title: "Infrastructure as Code",
          description: "Implement and manage your infrastructure using modern IaC tools for improved efficiency, consistency, and scalability."
        }
      ),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$6, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$6, children: "Our Infrastructure as Code Services" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
          {
            icon: Code,
            title: "IaC Implementation",
            content: "Implement infrastructure as code solutions using tools like Terraform, AWS CloudFormation, or Ansible."
          },
          {
            icon: GitBranch,
            title: "Version Control Integration",
            content: "Integrate your infrastructure code with version control systems for better collaboration and change tracking."
          },
          {
            icon: Cloud,
            title: "Multi-Cloud IaC",
            content: "Develop IaC solutions that work across multiple cloud providers for maximum flexibility and portability."
          }
        ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$6, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: service.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: service.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$6, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$6, children: "Why Choose Us for Infrastructure as Code" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
          {
            title: "Expertise Across IaC Tools",
            content: "Our team is proficient in a wide range of IaC tools, ensuring we can recommend and implement the best solution for your needs."
          },
          {
            title: "Focus on Best Practices",
            content: "We implement IaC following industry best practices, ensuring your infrastructure is secure, scalable, and maintainable."
          },
          {
            title: "Continuous Integration",
            content: "We integrate IaC into your CI/CD pipelines, enabling automated testing and deployment of infrastructure changes."
          },
          {
            title: "Knowledge Transfer",
            content: "We provide comprehensive training and documentation to ensure your team can effectively manage and extend your IaC implementation."
          }
        ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$6, children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
            /* @__PURE__ */ jsx("p", { children: item.content })
          ] })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$6, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$6, children: "Our Infrastructure as Code Process" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
          {
            icon: BarChart,
            title: "1. Assessment",
            content: "We evaluate your current infrastructure and develop an IaC strategy aligned with your business goals."
          },
          {
            icon: Code,
            title: "2. Design",
            content: "We design your infrastructure as code, focusing on modularity, reusability, and best practices."
          },
          {
            icon: GitBranch,
            title: "3. Implementation",
            content: "We implement the IaC solution, integrating with your existing systems and processes."
          },
          {
            icon: Users,
            title: "4. Training & Support",
            content: "We provide comprehensive training and ongoing support to ensure successful adoption of IaC practices."
          }
        ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$6, children: /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
            /* @__PURE__ */ jsx(CardTitle, { children: step.title })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { children: step.content })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { ref: sectionRef, className: "py-24 bg-[#F8F9FA] overflow-hidden", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 50 },
            animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
            transition: { duration: 0.8, ease: "easeOut" },
            className: "container mx-auto px-4 text-center mb-12",
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Infrastructure as Code Technologies We Use" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "We leverage industry-leading IaC tools to implement robust and scalable infrastructure solutions." })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#F8F9FA] to-transparent z-10" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { x: 0 },
              animate: { x: "-50%" },
              transition: {
                duration: 30,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
              },
              className: "flex items-center space-x-16 whitespace-nowrap py-8",
              children: technologies$6.concat(technologies$6).map((tech, index) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex-shrink-0 h-20 w-[200px] transition-all duration-300 hover:scale-110",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: tech.logo || "/placeholder.svg",
                        alt: `${tech.name} logo`,
                        className: "w-16 h-16 object-contain"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-600", children: tech.name })
                  ] })
                },
                `${tech.name}-${index}`
              ))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$6, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$6, children: "Ready to implement Infrastructure as Code?" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$6, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
          "Get Started",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$6, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
        /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$6, children: "Frequently Asked Questions" }),
        /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$6, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
          {
            question: "What is Infrastructure as Code (IaC)?",
            answer: "Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It allows you to manage your IT infrastructure using configuration files, making it easier to edit and distribute configurations, and ensuring that you provision the same environment every time."
          },
          {
            question: "What are the benefits of using Infrastructure as Code?",
            answer: "IaC offers numerous benefits, including: 1) Consistency and reduced errors in infrastructure deployment, 2) Faster provisioning and scaling of infrastructure, 3) Version control and change tracking for infrastructure, 4) Easier collaboration among team members, 5) Improved documentation of infrastructure, 6) Cost reduction through efficient resource utilization, and 7) Enhanced security through consistent application of security policies."
          },
          {
            question: "Which IaC tools do you work with?",
            answer: "We work with a variety of IaC tools to suit different needs and environments. Some popular tools we use include Terraform, AWS CloudFormation, Ansible, Puppet, and Chef. We also have experience with newer tools like Pulumi and cloud-specific solutions like Azure Resource Manager. We can help you choose the best tool for your specific requirements and integrate it into your workflow."
          },
          {
            question: "How do you ensure security in IaC implementations?",
            answer: "Security is a crucial aspect of our IaC implementations. We incorporate security best practices into our IaC templates, including proper access controls, encryption, and network segmentation. We also use tools to scan IaC code for potential security issues and integrate security checks into the CI/CD pipeline. Additionally, we implement infrastructure monitoring and logging to detect and respond to potential security incidents."
          },
          {
            question: "Can you integrate IaC with our existing CI/CD pipeline?",
            answer: "Yes, we specialize in integrating IaC with existing CI/CD pipelines. This integration allows for automated testing and deployment of infrastructure changes alongside your application code. We can work with various CI/CD tools such as Jenkins, GitLab CI, GitHub Actions, and others to ensure seamless integration of your IaC workflows."
          },
          {
            question: "How long does it typically take to implement an IaC solution?",
            answer: "The timeline for implementing an IaC solution can vary depending on the complexity of your infrastructure and the scope of the project. A basic implementation might take a few weeks, while more complex, enterprise-wide solutions could take several months. We work closely with your team to develop a phased approach, often starting with a pilot project to demonstrate value quickly before expanding to your full infrastructure."
          }
        ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
          /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
        ] }, index)) }) })
      ] }) }),
      /* @__PURE__ */ jsx(Footer, {})
    ] })
  ] });
}
const __vite_glob_0_21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: InfrastructureAsCodePage
}, Symbol.toStringTag, { value: "Module" }));
const technologies$5 = [
  {
    name: "AWS Migration Hub",
    logo: "https://d1.awsstatic.com/icons/aws-icons/AWS-Migration-Hub_icon_64_squid.3cea7d6a3d2c3c0c0d4bfb3c6d0e3e0e.png"
  },
  {
    name: "Azure Migrate",
    logo: "https://azure.microsoft.com/svghandler/migrate/?width=300&height=300"
  },
  {
    name: "Google Cloud Migrate",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg"
  },
  {
    name: "VMware vSphere",
    logo: "https://www.vmware.com/content/dam/digitalmarketing/vmware/en/images/company/vmware-logo-grey.svg"
  },
  {
    name: "Terraform",
    logo: "https://www.terraform.io/img/logo-hashicorp.svg"
  },
  {
    name: "Ansible",
    logo: "https://www.ansible.com/hubfs/2016_Images/Assets/Ansible-Mark-Large-RGB-Mango.png"
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/sites/default/files/d8/2019-07/vertical-logo-monochromatic.png"
  },
  {
    name: "Kubernetes",
    logo: "https://kubernetes.io/images/favicon.png"
  },
  {
    name: "CloudEndure Migration",
    logo: "https://d1.awsstatic.com/product-marketing/CloudEndure/CloudEndure_logo_light.3a2fddd4fb1aef9c41c14e0bd52de4ef4b9b15a7.png"
  },
  {
    name: "Carbonite Migrate",
    logo: "https://www.carbonite.com/globalassets/images/logos/carbonite-logo-2020.svg"
  },
  {
    name: "Velostrata",
    logo: "https://velostrata.com/wp-content/themes/velostrata/images/logo.png"
  }
];
const fadeInUp$5 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$5 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function InfrastructureMigration() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: ArrowRightLeft,
        title: "Infrastructure Migration",
        description: "Seamlessly migrate your infrastructure to modern, scalable platforms with minimal downtime."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$5, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$5, children: "Our Infrastructure Migration Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Cloud,
          title: "Cloud Migration",
          content: "Migrate your on-premises infrastructure to leading cloud platforms like AWS, Azure, or Google Cloud."
        },
        {
          icon: Server,
          title: "Data Center Consolidation",
          content: "Streamline your data centers, reducing costs and improving operational efficiency."
        },
        {
          icon: Database,
          title: "Database Migration",
          content: "Seamlessly transfer your databases to modern, scalable platforms while ensuring data integrity."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$5, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$5, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$5, children: "Why Choose Us for Infrastructure Migration" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Minimal Downtime",
          content: "Our migration strategies are designed to minimize disruption to your business operations."
        },
        {
          title: "Comprehensive Planning",
          content: "We develop detailed migration plans tailored to your specific infrastructure and business needs."
        },
        {
          title: "Security-First Approach",
          content: "We prioritize the security of your data and systems throughout the migration process."
        },
        {
          title: "Post-Migration Optimization",
          content: "We ensure your migrated infrastructure is optimized for performance and cost-efficiency."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$5, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$5, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$5, children: "Our Infrastructure Migration Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: Server,
          title: "1. Assessment",
          content: "We thoroughly assess your current infrastructure and develop a comprehensive migration strategy."
        },
        {
          icon: Cloud,
          title: "2. Planning",
          content: "We create a detailed migration plan, including timelines, resources, and risk mitigation strategies."
        },
        {
          icon: ArrowRightLeft,
          title: "3. Migration",
          content: "We execute the migration process, ensuring data integrity and minimal disruption to operations."
        },
        {
          icon: Shield,
          title: "4. Validation & Optimization",
          content: "We validate the migrated infrastructure and optimize it for performance and cost-efficiency."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$5, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$5, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$5, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$5, children: "Ready to modernize your infrastructure?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$5, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$5, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$5, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$5, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "How long does a typical infrastructure migration take?",
          answer: "The duration of an infrastructure migration can vary significantly depending on the size and complexity of your current infrastructure, as well as the target environment. A small to medium-sized migration might take a few weeks to a couple of months, while larger, more complex migrations could take several months to a year. We work closely with you to develop a realistic timeline and ensure minimal disruption to your operations throughout the process."
        },
        {
          question: "How do you ensure data security during the migration process?",
          answer: "Data security is our top priority during migrations. We implement multiple layers of security measures, including encryption for data in transit and at rest, secure VPN connections, and strict access controls. We also perform thorough security audits before, during, and after the migration process. Additionally, we ensure compliance with relevant industry standards and regulations throughout the migration."
        },
        {
          question: "Can you migrate our infrastructure to multiple cloud providers?",
          answer: "Yes, we have expertise in multi-cloud migrations. We can help you distribute your infrastructure across multiple cloud providers to optimize for cost, performance, and redundancy. Our team is well-versed in the nuances of different cloud platforms and can design a migration strategy that leverages the strengths of each provider while ensuring interoperability and efficient management."
        },
        {
          question: "How do you handle legacy systems during migration?",
          answer: "Legacy systems often require special attention during migrations. Our approach includes thorough assessment of legacy systems, identifying dependencies, and determining the best migration strategy - whether it's lift-and-shift, re-platforming, or re-architecting. We may use specialized tools for legacy migrations and often implement middleware or APIs to ensure compatibility with modern systems. In some cases, we might recommend phased migration approaches to minimize risk and disruption."
        },
        {
          question: "What kind of support do you provide post-migration?",
          answer: "Our support doesn't end with the migration. We provide comprehensive post-migration support, including monitoring, optimization, and troubleshooting. We ensure that your team is well-trained on the new infrastructure and can manage day-to-day operations. We also offer ongoing managed services if you prefer to have continuous expert support. Our goal is to ensure that you're getting the maximum benefit from your newly migrated infrastructure."
        },
        {
          question: "How do you minimize downtime during the migration process?",
          answer: "Minimizing downtime is a critical aspect of our migration strategy. We employ several techniques including parallel environments, data synchronization, incremental migration, off-peak scheduling, automated migration tools, and robust rollback procedures. Our goal is to make the transition as seamless as possible, often achieving near-zero downtime for critical systems."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: InfrastructureMigration
}, Symbol.toStringTag, { value: "Module" }));
const technologies$4 = [
  {
    name: "TensorFlow",
    logo: "https://www.tensorflow.org/images/tf_logo_social.png"
  },
  {
    name: "PyTorch",
    logo: "https://pytorch.org/assets/images/pytorch-logo.png"
  },
  {
    name: "Kubernetes",
    logo: "https://kubernetes.io/images/favicon.png"
  },
  {
    name: "Kubeflow",
    logo: "https://www.kubeflow.org/docs/images/logo.svg"
  },
  {
    name: "MLflow",
    logo: "https://www.mlflow.org/docs/latest/_static/MLflow-logo-final-black.png"
  },
  {
    name: "Apache Airflow",
    logo: "https://airflow.apache.org/docs/apache-airflow/stable/_images/pin_large.png"
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/sites/default/files/d8/2019-07/vertical-logo-monochromatic.png"
  },
  {
    name: "Nvidia CUDA",
    logo: "https://developer.nvidia.com/sites/default/files/akamai/cuda/images/cuda_logo_white.jpg"
  },
  {
    name: "Amazon SageMaker",
    logo: "https://d1.awsstatic.com/logos/aws/SageMaker_Amazon.6e2760a8a5f7e5f3a8b7e9f9b6d2f7e7e5f3a8b7e9f9b6d2f7e7.png"
  },
  {
    name: "Google Cloud AI Platform",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v2210075187f059b839246c2c03840474501c3c6024a99fb78f6293c1b4c0f664/cloud/images/cloud-logo.svg"
  },
  {
    name: "Azure Machine Learning",
    logo: "https://azure.microsoft.com/svghandler/machine-learning/?width=300&height=300"
  }
];
const fadeInUp$4 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$4 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function MLOps() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Brain,
        title: "MLOps (AI/ML Infrastructure)",
        description: "Build and manage robust infrastructure for AI/ML workflows, from development to production."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$4, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$4, children: "Our MLOps Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Cloud,
          title: "ML Infrastructure Design",
          content: "Design scalable and efficient infrastructure to support your AI/ML workflows and model deployments."
        },
        {
          icon: GitBranch,
          title: "CI/CD for ML",
          content: "Implement continuous integration and deployment pipelines specifically tailored for machine learning models."
        },
        {
          icon: BarChart,
          title: "Model Monitoring",
          content: "Set up comprehensive monitoring systems to track model performance, data drift, and system health."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$4, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$4, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$4, children: "Why Choose Us for MLOps" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "End-to-End Expertise",
          content: "Our team has deep expertise in both machine learning and DevOps, ensuring seamless integration of ML workflows."
        },
        {
          title: "Scalable Solutions",
          content: "We design MLOps solutions that can scale with your AI/ML initiatives, from proof-of-concept to enterprise-wide deployments."
        },
        {
          title: "Best Practices Implementation",
          content: "We implement industry best practices for reproducibility, versioning, and governance in ML workflows."
        },
        {
          title: "Cloud-Agnostic Approach",
          content: "Our MLOps solutions work across major cloud providers and on-premises infrastructure, giving you flexibility and avoiding vendor lock-in."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$4, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$4, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$4, children: "Our MLOps Implementation Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: Brain,
          title: "1. Assessment",
          content: "We evaluate your current ML workflows and infrastructure to identify areas for improvement and automation."
        },
        {
          icon: Cloud,
          title: "2. Design",
          content: "We design a comprehensive MLOps architecture tailored to your specific needs and scale."
        },
        {
          icon: GitBranch,
          title: "3. Implementation",
          content: "We implement the MLOps solution, integrating with your existing tools and processes."
        },
        {
          icon: Users,
          title: "4. Training & Support",
          content: "We provide thorough training and ongoing support to ensure successful adoption of MLOps practices."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$4, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$4, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$4, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$4, children: "Ready to optimize your AI/ML infrastructure?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$4, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$4, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$4, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$4, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What is MLOps and why is it important?",
          answer: "MLOps, or Machine Learning Operations, is a set of practices that combines Machine Learning, DevOps, and Data Engineering to deploy and maintain ML models in production reliably and efficiently. It's important because it addresses the unique challenges of ML systems, such as reproducibility, versioning, and the need for continuous monitoring and retraining. MLOps helps organizations move from experimental ML projects to production-ready AI systems that deliver consistent business value."
        },
        {
          question: "How does MLOps differ from traditional DevOps?",
          answer: "While MLOps builds on DevOps principles, it addresses the specific needs of ML systems. Key differences include: 1) Data versioning and management, as ML models depend heavily on data, 2) Model versioning, which goes beyond code versioning, 3) Experiment tracking and reproducibility, 4) Model-specific testing and validation, 5) Continuous monitoring for model performance and data drift, and 6) Automated retraining and deployment of models. These additional complexities make MLOps a specialized field that requires expertise in both ML and operations."
        },
        {
          question: "What are the key components of an MLOps pipeline?",
          answer: "A comprehensive MLOps pipeline typically includes the following key components: 1) Data ingestion and preparation, 2) Feature engineering and storage, 3) Model training and hyperparameter tuning, 4) Model evaluation and validation, 5) Model versioning and registry, 6) Model deployment and serving, 7) Monitoring and logging, 8) Automated retraining and deployment. Each of these components requires careful design and implementation to ensure a smooth, efficient, and reliable ML workflow."
        },
        {
          question: "How do you handle model versioning in MLOps?",
          answer: "Model versioning is crucial in MLOps to ensure reproducibility and traceability. We use specialized tools like MLflow or DVC (Data Version Control) to version not just the model code, but also the data, hyperparameters, and entire training environment. This allows us to recreate any model version exactly as it was. We also implement a model registry that serves as a centralized repository for managing model versions, including metadata about each version's performance, training data, and deployment status."
        },
        {
          question: "How do you ensure the security of ML models and data in an MLOps setup?",
          answer: "Security is a critical aspect of our MLOps implementations. We employ several strategies: 1) Data encryption both at rest and in transit, 2) Strict access controls and authentication for all components of the ML pipeline, 3) Secure model serving with API authentication and rate limiting, 4) Regular security audits and vulnerability assessments, 5) Compliance with data protection regulations like GDPR or CCPA, 6) Secure feature stores with proper data governance, and 7) Monitoring for unusual access patterns or potential data leaks. We also work closely with your security team to ensure our MLOps setup aligns with your organization's security policies."
        },
        {
          question: "Can you help with the transition from traditional data science workflows to MLOps?",
          answer: "We specialize in helping organizations make this transition. Our approach includes: 1) Assessing your current workflows and identifying areas for improvement, 2) Introducing MLOps tools and practices gradually to minimize disruption, 3) Setting up automated CI/CD pipelines for ML workflows, 4) Implementing proper versioning for data, code, and models, 5) Establishing monitoring and logging practices for production models, 6) Training your team on MLOps best practices and tools. We understand that this transition can be challenging, so we work closely with your team to ensure a smooth adoption of MLOps practices."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MLOps
}, Symbol.toStringTag, { value: "Module" }));
const technologies$3 = [
  {
    name: "Prometheus",
    logo: "https://raw.githubusercontent.com/cncf/artwork/master/projects/prometheus/icon/color/prometheus-icon-color.svg"
  },
  {
    name: "Grafana",
    logo: "https://grafana.com/static/img/logos/grafana_logo_swirl_fullcolor.svg"
  },
  {
    name: "ELK Stack",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt36f2da8d650732a0/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg"
  },
  {
    name: "Datadog",
    logo: "https://imgix.datadoghq.com/img/about/presskit/logo-v/dd_vertical_purple.png"
  },
  {
    name: "New Relic",
    logo: "https://newrelic.com/themes/custom/erno/assets/mediakit/new_relic_logo_vertical.svg"
  },
  {
    name: "Splunk",
    logo: "https://www.splunk.com/content/dam/splunk-blogs/images/2017/02/splunk-logo.png"
  },
  {
    name: "Nagios",
    logo: "https://www.nagios.org/wp-content/uploads/2015/05/Nagios-Logo.jpg"
  },
  {
    name: "Zabbix",
    logo: "https://assets.zabbix.com/img/logo/zabbix_logo_500x131.png"
  },
  {
    name: "Jaeger",
    logo: "https://www.jaegertracing.io/img/jaeger-logo.png"
  },
  {
    name: "Zipkin",
    logo: "https://zipkin.io/public/img/zipkin-logo-200x119.jpg"
  },
  {
    name: "AWS CloudWatch",
    logo: "https://d1.awsstatic.com/icons/aws-icons/AWS-CloudWatch_icon_64_Squid.4c65a3d318a1e2c52a77f4f60b336430c9d7294a.png"
  }
];
const fadeInUp$3 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$3 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function MonitoringObservability() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: MonitorSmartphone,
        title: "Monitoring and Observability",
        description: "Implement comprehensive monitoring and observability solutions for your entire stack."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$3, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$3, children: "Our Monitoring and Observability Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: MonitorSmartphone,
          title: "Infrastructure Monitoring",
          content: "Implement comprehensive monitoring solutions for your entire infrastructure, from servers to cloud services."
        },
        {
          icon: BarChart,
          title: "Application Performance Monitoring",
          content: "Set up detailed application performance monitoring to track and optimize your software's performance."
        },
        {
          icon: Bell,
          title: "Alerting and Incident Response",
          content: "Develop robust alerting systems and incident response processes to quickly address issues as they arise."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$3, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$3, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$3, children: "Why Choose Us for Monitoring and Observability" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Holistic Approach",
          content: "We provide end-to-end monitoring solutions that cover your entire stack, from infrastructure to applications."
        },
        {
          title: "Custom Dashboards",
          content: "We create tailored dashboards that give you instant visibility into the metrics that matter most to your business."
        },
        {
          title: "Proactive Issue Detection",
          content: "Our advanced alerting systems help you catch and resolve issues before they impact your users."
        },
        {
          title: "Continuous Improvement",
          content: "We help you leverage monitoring data to continuously optimize your systems and processes."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$3, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$3, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$3, children: "Our Monitoring and Observability Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: MonitorSmartphone,
          title: "1. Assessment",
          content: "We evaluate your current monitoring setup and identify areas for improvement and coverage gaps."
        },
        {
          icon: Cloud,
          title: "2. Design",
          content: "We design a comprehensive monitoring and observability strategy tailored to your specific needs."
        },
        {
          icon: GitBranch,
          title: "3. Implementation",
          content: "We set up and configure monitoring tools, create custom dashboards, and implement alerting systems."
        },
        {
          icon: BarChart,
          title: "4. Optimization",
          content: "We continuously refine your monitoring setup, adjusting thresholds and adding new metrics as needed."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$3, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$3, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$3, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$3, children: "Ready to enhance your monitoring and observability?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$3, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$3, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$3, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$3, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What's the difference between monitoring and observability?",
          answer: "While monitoring and observability are related, they serve different purposes. Monitoring typically involves tracking predefined sets of metrics and logs to understand the health and performance of systems. Observability, on the other hand, goes a step further by providing deeper insights into the internal states of systems based on the data they generate. It allows you to understand and debug complex systems, even when facing unforeseen issues."
        },
        {
          question: "What tools do you use for monitoring and observability?",
          answer: "We use a variety of tools depending on the specific needs and existing infrastructure of each client. Some common tools we work with include Prometheus, Grafana, ELK stack (Elasticsearch, Logstash, Kibana), Datadog, New Relic, and cloud-native solutions like AWS CloudWatch or Google Cloud's operations suite. We can also integrate with existing tools you may already be using."
        },
        {
          question: "How can improved monitoring and observability benefit my business?",
          answer: "Improved monitoring and observability can significantly benefit your business by providing real-time insights into your systems' performance and health. This leads to faster problem detection and resolution, reduced downtime, improved user experience, and more efficient resource utilization. It also enables data-driven decision making and can help in capacity planning and cost optimization."
        },
        {
          question: "Can you help with setting up custom dashboards and alerts?",
          answer: "Yes, we specialize in creating custom dashboards and alert systems tailored to your specific needs. We work closely with your team to understand what metrics and indicators are most important for your business, and then design intuitive, informative dashboards to visualize this data. We also set up intelligent alerting systems that can notify the right people at the right time, helping to minimize false alarms and ensure quick responses to real issues."
        },
        {
          question: "How do you handle monitoring for microservices architectures?",
          answer: "Monitoring microservices architectures requires a specialized approach due to their distributed nature. We implement distributed tracing to track requests across multiple services, use service meshes for improved visibility, and set up centralized logging and monitoring solutions. We also focus on implementing effective health checks, dependency mapping, and anomaly detection to ensure the overall health and performance of your microservices ecosystem."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MonitoringObservability
}, Symbol.toStringTag, { value: "Module" }));
const technologies$2 = [
  {
    name: "New Relic",
    logo: "https://newrelic.com/themes/custom/erno/assets/mediakit/new_relic_logo_vertical.svg"
  },
  {
    name: "Datadog",
    logo: "https://imgix.datadoghq.com/img/about/presskit/logo-v/dd_vertical_purple.png"
  },
  {
    name: "Prometheus",
    logo: "https://raw.githubusercontent.com/cncf/artwork/master/projects/prometheus/icon/color/prometheus-icon-color.svg"
  },
  {
    name: "Grafana",
    logo: "https://grafana.com/static/img/logos/grafana_logo_swirl_fullcolor.svg"
  },
  {
    name: "Apache JMeter",
    logo: "https://jmeter.apache.org/images/logo.svg"
  },
  {
    name: "Gatling",
    logo: "https://gatling.io/wp-content/uploads/2019/04/logo-gatling-transparent@15x.svg"
  },
  {
    name: "Elastic APM",
    logo: "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt05047fdbe3b9c333/5d0823c3d8ff351753cbc99f/logo-elastic-outlined-black.svg"
  },
  {
    name: "Dynatrace",
    logo: "https://assets.dynatrace.com/content/dam/dynatrace/misc/dynatrace_web.png"
  },
  {
    name: "Lighthouse",
    logo: "https://developers.google.com/web/tools/lighthouse/images/lighthouse-logo.svg"
  },
  {
    name: "WebPageTest",
    logo: "https://www.webpagetest.org/images/wpt-logo.png"
  },
  {
    name: "Redis",
    logo: "https://redis.io/images/redis-white.png"
  }
];
const fadeInUp$2 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$2 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function PerformanceOptimization() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Zap,
        title: "Performance Optimization",
        description: "Boost your application and infrastructure performance with expert analysis and optimization techniques."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$2, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$2, children: "Our Performance Optimization Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Gauge,
          title: "Application Performance Tuning",
          content: "Optimize your application's code, database queries, and overall architecture for maximum speed and efficiency."
        },
        {
          icon: Cloud,
          title: "Infrastructure Optimization",
          content: "Fine-tune your cloud or on-premises infrastructure to handle increased loads and reduce response times."
        },
        {
          icon: BarChart,
          title: "Performance Monitoring & Analysis",
          content: "Implement comprehensive monitoring solutions to identify bottlenecks and track performance improvements over time."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$2, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$2, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$2, children: "Why Choose Us for Performance Optimization" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Holistic Approach",
          content: "We optimize performance across all layers of your stack, from frontend to backend and infrastructure."
        },
        {
          title: "Data-Driven Optimization",
          content: "Our recommendations are based on thorough analysis and real-world performance data."
        },
        {
          title: "Scalability Focus",
          content: "We ensure your systems can handle growth and peak loads without compromising performance."
        },
        {
          title: "Continuous Improvement",
          content: "We implement ongoing monitoring and optimization processes to maintain peak performance over time."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$2, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$2, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$2, children: "Our Performance Optimization Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: BarChart,
          title: "1. Assessment",
          content: "We conduct a thorough analysis of your current performance metrics and identify bottlenecks."
        },
        {
          icon: Code,
          title: "2. Optimization Strategy",
          content: "We develop a tailored optimization plan based on our assessment findings."
        },
        {
          icon: Zap,
          title: "3. Implementation",
          content: "We implement the optimization measures, focusing on high-impact improvements."
        },
        {
          icon: Users,
          title: "4. Monitoring & Refinement",
          content: "We set up ongoing monitoring and continuously refine the optimizations based on real-world data."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$2, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$2, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$2, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$2, children: "Ready to supercharge your application's performance?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$2, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$2, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$2, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$2, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What areas of performance do you focus on?",
          answer: "We focus on all aspects of application and infrastructure performance, including frontend responsiveness, backend efficiency, database optimization, network latency reduction, and infrastructure scalability. Our goal is to improve overall system performance, reduce response times, and enhance user experience."
        },
        {
          question: "How long does the performance optimization process typically take?",
          answer: "The duration of the optimization process varies depending on the complexity of your system and the scope of improvements needed. A typical engagement might last 4-8 weeks for the initial assessment and implementation of key optimizations. However, we also offer ongoing optimization services to ensure continued performance improvements over time."
        },
        {
          question: "Can you help with mobile app performance optimization?",
          answer: "Yes, we have expertise in optimizing both native mobile apps and mobile web applications. Our mobile optimization services include improving app launch times, reducing battery consumption, optimizing network requests, and enhancing overall app responsiveness. We use mobile-specific profiling tools and follow best practices for iOS and Android platforms."
        },
        {
          question: "How do you approach database performance optimization?",
          answer: "Our database optimization approach includes analyzing query performance, optimizing indexing strategies, improving data models, and fine-tuning database configurations. We work with various database systems, including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB. We also implement caching strategies and database sharding when necessary to improve scalability."
        },
        {
          question: "Do you offer performance optimization for e-commerce platforms?",
          answer: "Absolutely. We have extensive experience optimizing e-commerce platforms to handle high traffic volumes, especially during peak sales periods. Our e-commerce optimization services include improving page load times, optimizing checkout processes, implementing efficient caching strategies, and ensuring seamless integration with payment gateways and inventory management systems."
        },
        {
          question: "How do you measure the success of performance optimizations?",
          answer: "We use a variety of metrics to measure the success of our optimizations, including response times, throughput, error rates, and resource utilization. We also focus on business-relevant metrics such as conversion rates, user engagement, and customer satisfaction scores. We implement comprehensive monitoring solutions to track these metrics before, during, and after the optimization process, providing you with clear visibility into the improvements achieved."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PerformanceOptimization
}, Symbol.toStringTag, { value: "Module" }));
const technologies$1 = [
  {
    name: "Nessus",
    logo: "https://www.tenable.com/sites/drupal.dmz.tenablesecurity.com/files/images/product-images/Nessus-2020.svg"
  },
  {
    name: "Qualys",
    logo: "https://www.qualys.com/asset/image/qualys-logo.svg"
  },
  {
    name: "Metasploit",
    logo: "https://www.metasploit.com/includes/images/metasploit-logo.svg"
  },
  {
    name: "Wireshark",
    logo: "https://www.wireshark.org/assets/theme-2015/images/wireshark_logo.png"
  },
  {
    name: "Burp Suite",
    logo: "https://portswigger.net/content/images/svg/icons/professional.svg"
  },
  {
    name: "OWASP ZAP",
    logo: "https://www.zaproxy.org/img/zap-logo.svg"
  },
  {
    name: "Snort",
    logo: "https://www.snort.org/assets/logo-8f4dbc9a0f1c9c8f6d3f4f7f7f7f7f7f.png"
  },
  {
    name: "Splunk",
    logo: "https://www.splunk.com/content/dam/splunk-blogs/images/2017/02/splunk-logo.png"
  },
  {
    name: "Kali Linux",
    logo: "https://www.kali.org/images/kali-logo.svg"
  },
  {
    name: "AWS Security Hub",
    logo: "https://d1.awsstatic.com/icons/console_securityhub_icon.be2b86cd1b1a41e1d1d1c0c9d42d77981413213d.png"
  },
  {
    name: "Azure Security Center",
    logo: "https://azure.microsoft.com/svghandler/security-center/?width=300&height=300"
  }
];
const fadeInUp$1 = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren$1 = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function SecurityConsulting() {
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Shield,
        title: "Security Consulting",
        description: "Enhance your organization's security posture with expert consulting and implementation services."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$1, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$1, children: "Our Security Consulting Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: AlertTriangle,
          title: "Vulnerability Assessment",
          content: "Identify and prioritize security vulnerabilities in your systems, applications, and infrastructure."
        },
        {
          icon: FileSearch,
          title: "Security Audits",
          content: "Conduct comprehensive security audits to ensure compliance with industry standards and best practices."
        },
        {
          icon: Lock,
          title: "Security Architecture Design",
          content: "Design and implement robust security architectures tailored to your organization's needs and risk profile."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$1, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$1, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$1, children: "Why Choose Us for Security Consulting" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Experienced Security Experts",
          content: "Our team consists of certified security professionals with years of experience in various industries."
        },
        {
          title: "Comprehensive Approach",
          content: "We take a holistic view of security, addressing technical, operational, and human factors."
        },
        {
          title: "Cutting-edge Tools and Techniques",
          content: "We utilize the latest security tools and methodologies to stay ahead of emerging threats."
        },
        {
          title: "Tailored Solutions",
          content: "Our recommendations are customized to your specific business needs, risk profile, and compliance requirements."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp$1, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$1, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$1, children: "Our Security Consulting Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: Eye,
          title: "1. Assessment",
          content: "We conduct a thorough assessment of your current security posture, identifying vulnerabilities and risks."
        },
        {
          icon: BarChart,
          title: "2. Analysis",
          content: "We analyze the findings and develop a comprehensive security strategy tailored to your needs."
        },
        {
          icon: Shield,
          title: "3. Implementation",
          content: "We work with you to implement recommended security measures and best practices."
        },
        {
          icon: Users,
          title: "4. Training & Support",
          content: "We provide ongoing training and support to ensure long-term security effectiveness."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$1, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies: technologies$1, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren$1, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp$1, children: "Ready to enhance your security posture?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$1, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren$1, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp$1, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp$1, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What types of security assessments do you offer?",
          answer: "We offer a wide range of security assessments, including vulnerability assessments, penetration testing, code reviews, network security assessments, cloud security assessments, and social engineering tests. Our approach is tailored to your specific needs and risk profile."
        },
        {
          question: "How often should we conduct security assessments?",
          answer: "The frequency of security assessments depends on various factors, including your industry, regulatory requirements, and risk profile. Generally, we recommend conducting comprehensive assessments at least annually, with more frequent targeted assessments for critical systems or after significant changes to your infrastructure."
        },
        {
          question: "Can you help with compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?",
          answer: "Yes, we have extensive experience in helping organizations achieve and maintain compliance with various regulatory standards. Our team is well-versed in GDPR, HIPAA, PCI DSS, ISO 27001, and other industry-specific regulations. We can assist with gap analysis, implementation of required controls, and preparation for audits."
        },
        {
          question: "How do you handle the security of cloud environments?",
          answer: "We have expertise in securing cloud environments across major providers like AWS, Azure, and Google Cloud. Our approach includes assessing cloud configurations, implementing security best practices, setting up proper identity and access management, ensuring data encryption, and establishing continuous monitoring. We also assist with cloud-native security tools and services specific to each platform."
        },
        {
          question: "What's your approach to incident response planning?",
          answer: "Our incident response planning service involves developing a comprehensive plan tailored to your organization. This includes defining roles and responsibilities, establishing communication protocols, creating incident classification and escalation procedures, and setting up tools for detection and response. We also conduct tabletop exercises to test and refine the plan, ensuring your team is prepared to handle security incidents effectively."
        },
        {
          question: "How do you stay updated with the latest security threats and technologies?",
          answer: "Staying current is crucial in the rapidly evolving field of cybersecurity. Our team regularly participates in industry conferences, undergoes continuous training, and maintains various security certifications. We also subscribe to threat intelligence feeds, participate in security communities, and conduct ongoing research to stay ahead of emerging threats and technologies."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SecurityConsulting
}, Symbol.toStringTag, { value: "Module" }));
const technologies = [
  {
    name: "AWS Lambda",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Amazon_Lambda_architecture_logo.svg"
  },
  {
    name: "AWS API Gateway",
    logo: "/images/logos/api-gateway.png"
  },
  {
    name: "AWS DynamoDB",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/DynamoDB.png"
  },
  {
    name: "AWS S3",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Amazon-S3-Logo.svg"
  },
  {
    name: "Azure Functions",
    logo: "https://azure.microsoft.com/svghandler/functions/?width=300&height=300"
  },
  {
    name: "Google Cloud Functions",
    logo: "https://seeklogo.com/images/G/google-cloud-functions-logo-AECD57BFA2-seeklogo.com.png"
  },
  {
    name: "Vercel",
    logo: "https://assets.vercel.com/image/upload/v1607554385/repositories/vercel/logo.png"
  },
  {
    name: "Netlify",
    logo: "https://www.netlify.com/v3/img/components/logomark.png"
  },
  {
    name: "CloudFlare Workers",
    logo: "/images/logos/cloudflare-workers.svg"
  },
  {
    name: "AWS Step Functions",
    logo: "/images/logos/step-functions.png"
  },
  {
    name: "AWS EventBridge",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3d/AWS_EventBridge_logo.svg"
  }
];
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};
const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
};
function ServerlessInfrastructure() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs("main", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Menubar, {}),
    /* @__PURE__ */ jsx(
      ServiceHero,
      {
        icon: Cloud,
        title: "Serverless Infrastructure",
        description: "Design and implement scalable serverless solutions to reduce operational overhead and costs while improving scalability."
      }
    ),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp, children: "Our Serverless Infrastructure Services" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
        {
          icon: Cloud,
          title: "Serverless Architecture Design",
          content: "Design scalable and cost-effective serverless architectures tailored to your specific business needs."
        },
        {
          icon: Code,
          title: "Function Development",
          content: "Develop and optimize serverless functions with best practices for performance and cost efficiency."
        },
        {
          icon: Database,
          title: "Data Integration",
          content: "Seamlessly integrate serverless functions with databases, storage, and other cloud services."
        }
      ].map((service, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(service.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: service.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: service.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp, children: "Why Choose Us for Serverless Infrastructure" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        {
          title: "Cloud Provider Expertise",
          content: "Deep expertise across major cloud providers' serverless offerings, including AWS Lambda, Azure Functions, and Google Cloud Functions."
        },
        {
          title: "Cost Optimization",
          content: "Implement cost-effective serverless architectures with optimized function execution and resource utilization."
        },
        {
          title: "Performance Tuning",
          content: "Optimize function performance through code optimization, memory allocation, and execution environment configuration."
        },
        {
          title: "Security First",
          content: "Implement robust security measures including IAM policies, encryption, and secure API endpoints."
        }
      ].map((item, index) => /* @__PURE__ */ jsxs(motion.div, { className: "flex items-start space-x-4", variants: fadeInUp, children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-[#7C3AED] flex-shrink-0 mt-1" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: item.title }),
          /* @__PURE__ */ jsx("p", { children: item.content })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp, children: "Our Serverless Implementation Process" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
        {
          icon: BarChart,
          title: "1. Assessment",
          content: "Evaluate your current architecture and requirements to determine the optimal serverless approach."
        },
        {
          icon: Code,
          title: "2. Design",
          content: "Design a scalable serverless architecture that meets your performance and cost requirements."
        },
        {
          icon: GitBranch,
          title: "3. Implementation",
          content: "Develop and deploy serverless functions with proper testing, monitoring, and error handling."
        },
        {
          icon: Users,
          title: "4. Optimization",
          content: "Continuously monitor and optimize function performance, costs, and resource utilization."
        }
      ].map((step, index) => /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp, children: /* @__PURE__ */ jsxs(Card$1, { children: [
        /* @__PURE__ */ jsxs(CardHeader$1, { children: [
          /* @__PURE__ */ jsx(step.icon, { className: "w-10 h-10 text-[#7C3AED] mb-4" }),
          /* @__PURE__ */ jsx(CardTitle$1, { children: step.title })
        ] }),
        /* @__PURE__ */ jsx(CardContent$1, { children: step.content })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx(InfiniteScrollTech, { technologies, backgroundColor: "#F8F9FA" }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-white", initial: "initial", animate: "animate", variants: staggerChildren, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold mb-8", variants: fadeInUp, children: "Ready to go serverless?" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp, children: /* @__PURE__ */ jsx(Link, { href: "/contact", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white", children: [
        "Get Started",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsx(motion.section, { className: "py-24 bg-gray-50", initial: "initial", animate: "animate", variants: staggerChildren, children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx(motion.h2, { className: "text-3xl font-bold text-center mb-12", variants: fadeInUp, children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx(motion.div, { variants: fadeInUp, children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "max-w-3xl mx-auto", children: [
        {
          question: "What is serverless infrastructure?",
          answer: "Serverless infrastructure is a cloud computing execution model where the cloud provider automatically manages the infrastructure needed to run your code. You only pay for the actual compute time used by your functions, making it highly cost-effective for many use cases. This approach eliminates the need to provision and manage servers, allowing developers to focus solely on writing code."
        },
        {
          question: "What are the benefits of going serverless?",
          answer: "Serverless offers numerous benefits including: 1) Reduced operational costs - pay only for actual usage, 2) Automatic scaling - handles varying workloads efficiently, 3) Reduced maintenance - no server management required, 4) Faster time to market - focus on code, not infrastructure, 5) Built-in high availability and fault tolerance, and 6) Improved developer productivity through simplified deployment and operations."
        },
        {
          question: "Is serverless suitable for all applications?",
          answer: "While serverless is powerful, it's not a one-size-fits-all solution. It's particularly well-suited for event-driven applications, APIs, data processing, and applications with variable workloads. However, applications with consistent, long-running processes or those requiring very low latency might be better served by traditional server-based architectures. We can help evaluate your specific use case to determine if serverless is the right choice."
        },
        {
          question: "How do you handle monitoring and debugging in serverless applications?",
          answer: "We implement comprehensive monitoring and debugging strategies using cloud-native tools and third-party solutions. This includes: 1) Distributed tracing for function execution, 2) Detailed logging and error tracking, 3) Performance metrics monitoring, 4) Cost tracking and optimization, and 5) Real-time alerts for issues. We also implement proper error handling and retry mechanisms to ensure reliable operation."
        },
        {
          question: "How do you ensure security in serverless applications?",
          answer: "Security in serverless applications involves multiple layers: 1) Function-level security through proper IAM roles and permissions, 2) API security using authentication and authorization, 3) Data security through encryption at rest and in transit, 4) Network security with VPC integration when needed, 5) Regular security audits and vulnerability scanning, and 6) Compliance with relevant standards and regulations."
        },
        {
          question: "How do you handle state management in serverless applications?",
          answer: "While serverless functions are stateless by nature, we implement various strategies for state management: 1) Using managed database services like DynamoDB or Aurora Serverless, 2) Leveraging caching services for performance optimization, 3) Implementing event-driven architectures for complex workflows, 4) Using step functions for orchestration, and 5) Integrating with message queues for asynchronous processing."
        }
      ].map((faq, index) => /* @__PURE__ */ jsxs(AccordionItem, { value: `item-${index + 1}`, children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { children: faq.question }),
        /* @__PURE__ */ jsx(AccordionContent, { children: faq.answer })
      ] }, index)) }) })
    ] }) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const __vite_glob_0_27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ServerlessInfrastructure
}, Symbol.toStringTag, { value: "Module" }));
function Welcome({
  auth,
  laravelVersion,
  phpVersion
}) {
  const handleImageError = () => {
    var _a, _b, _c, _d;
    (_a = document.getElementById("screenshot-container")) == null ? void 0 : _a.classList.add("!hidden");
    (_b = document.getElementById("docs-card")) == null ? void 0 : _b.classList.add("!row-span-1");
    (_c = document.getElementById("docs-card-content")) == null ? void 0 : _c.classList.add("!flex-row");
    (_d = document.getElementById("background")) == null ? void 0 : _d.classList.add("!hidden");
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Welcome" }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 text-black/50 dark:bg-black dark:text-white/50", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          id: "background",
          className: "absolute -left-20 top-0 max-w-[877px]",
          src: "https://laravel.com/assets/img/welcome/background.svg"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-2xl px-6 lg:max-w-7xl", children: [
        /* @__PURE__ */ jsxs("header", { className: "grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex lg:col-start-2 lg:justify-center", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-12 w-auto text-white lg:h-16 lg:text-[#FF2D20]",
              viewBox: "0 0 62 65",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M61.8548 14.6253C61.8778 14.7102 61.8895 14.7978 61.8897 14.8858V28.5615C61.8898 28.737 61.8434 28.9095 61.7554 29.0614C61.6675 29.2132 61.5409 29.3392 61.3887 29.4265L49.9104 36.0351V49.1337C49.9104 49.4902 49.7209 49.8192 49.4118 49.9987L25.4519 63.7916C25.3971 63.8227 25.3372 63.8427 25.2774 63.8639C25.255 63.8714 25.2338 63.8851 25.2101 63.8913C25.0426 63.9354 24.8666 63.9354 24.6991 63.8913C24.6716 63.8838 24.6467 63.8689 24.6205 63.8589C24.5657 63.8389 24.5084 63.8215 24.456 63.7916L0.501061 49.9987C0.348882 49.9113 0.222437 49.7853 0.134469 49.6334C0.0465019 49.4816 0.000120578 49.3092 0 49.1337L0 8.10652C0 8.01678 0.0124642 7.92953 0.0348998 7.84477C0.0423783 7.8161 0.0598282 7.78993 0.0697995 7.76126C0.0884958 7.70891 0.105946 7.65531 0.133367 7.6067C0.152063 7.5743 0.179485 7.54812 0.20192 7.51821C0.230588 7.47832 0.256763 7.43719 0.290416 7.40229C0.319084 7.37362 0.356476 7.35243 0.388883 7.32751C0.425029 7.29759 0.457436 7.26518 0.498568 7.2415L12.4779 0.345059C12.6296 0.257786 12.8015 0.211853 12.9765 0.211853C13.1515 0.211853 13.3234 0.257786 13.475 0.345059L25.4531 7.2415H25.4556C25.4955 7.26643 25.5292 7.29759 25.5653 7.32626C25.5977 7.35119 25.6339 7.37362 25.6625 7.40104C25.6974 7.43719 25.7224 7.47832 25.7523 7.51821C25.7735 7.54812 25.8021 7.5743 25.8196 7.6067C25.8483 7.65656 25.8645 7.70891 25.8844 7.76126C25.8944 7.78993 25.9118 7.8161 25.9193 7.84602C25.9423 7.93096 25.954 8.01853 25.9542 8.10652V33.7317L35.9355 27.9844V14.8846C35.9355 14.7973 35.948 14.7088 35.9704 14.6253C35.9792 14.5954 35.9954 14.5692 36.0053 14.5405C36.0253 14.4882 36.0427 14.4346 36.0702 14.386C36.0888 14.3536 36.1163 14.3274 36.1375 14.2975C36.1674 14.2576 36.1923 14.2165 36.2272 14.1816C36.2559 14.1529 36.292 14.1317 36.3244 14.1068C36.3618 14.0769 36.3942 14.0445 36.4341 14.0208L48.4147 7.12434C48.5663 7.03694 48.7383 6.99094 48.9133 6.99094C49.0883 6.99094 49.2602 7.03694 49.4118 7.12434L61.3899 14.0208C61.4323 14.0457 61.4647 14.0769 61.5021 14.1055C61.5333 14.1305 61.5694 14.1529 61.5981 14.1803C61.633 14.2165 61.6579 14.2576 61.6878 14.2975C61.7103 14.3274 61.7377 14.3536 61.7551 14.386C61.7838 14.4346 61.8 14.4882 61.8199 14.5405C61.8312 14.5692 61.8474 14.5954 61.8548 14.6253ZM59.893 27.9844V16.6121L55.7013 19.0252L49.9104 22.3593V33.7317L59.8942 27.9844H59.893ZM47.9149 48.5566V37.1768L42.2187 40.4299L25.953 49.7133V61.2003L47.9149 48.5566ZM1.99677 9.83281V48.5566L23.9562 61.199V49.7145L12.4841 43.2219L12.4804 43.2194L12.4754 43.2169C12.4368 43.1945 12.4044 43.1621 12.3682 43.1347C12.3371 43.1097 12.3009 43.0898 12.2735 43.0624L12.271 43.0586C12.2386 43.0275 12.2162 42.9888 12.1887 42.9539C12.1638 42.9203 12.1339 42.8916 12.114 42.8567L12.1127 42.853C12.0903 42.8156 12.0766 42.7707 12.0604 42.7283C12.0442 42.6909 12.023 42.656 12.013 42.6161C12.0005 42.5688 11.998 42.5177 11.9931 42.4691C11.9881 42.4317 11.9781 42.3943 11.9781 42.3569V15.5801L6.18848 12.2446L1.99677 9.83281ZM12.9777 2.36177L2.99764 8.10652L12.9752 13.8513L22.9541 8.10527L12.9752 2.36177H12.9777ZM18.1678 38.2138L23.9574 34.8809V9.83281L19.7657 12.2459L13.9749 15.5801V40.6281L18.1678 38.2138ZM48.9133 9.14105L38.9344 14.8858L48.9133 20.6305L58.8909 14.8846L48.9133 9.14105ZM47.9149 22.3593L42.124 19.0252L37.9323 16.6121V27.9844L43.7219 31.3174L47.9149 33.7317V22.3593ZM24.9533 47.987L39.59 39.631L46.9065 35.4555L36.9352 29.7145L25.4544 36.3242L14.9907 42.3482L24.9533 47.987Z",
                  fill: "currentColor"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx("nav", { className: "-mx-3 flex flex-1 justify-end", children: auth.user ? /* @__PURE__ */ jsx(
            Link,
            {
              href: route("dashboard"),
              className: "rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white",
              children: "Dashboard"
            }
          ) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("login"),
                className: "rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white",
                children: "Log in"
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("register"),
                className: "rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white",
                children: "Register"
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("main", { className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2 lg:gap-8", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://laravel.com/docs",
              id: "docs-card",
              className: "flex flex-col items-start gap-6 overflow-hidden rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] md:row-span-3 lg:p-10 lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]",
              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    id: "screenshot-container",
                    className: "relative flex w-full flex-1 items-stretch",
                    children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: "https://laravel.com/assets/img/welcome/docs-light.svg",
                          alt: "Laravel documentation screenshot",
                          className: "aspect-video h-full w-full flex-1 rounded-[10px] object-cover object-top drop-shadow-[0px_4px_34px_rgba(0,0,0,0.06)] dark:hidden",
                          onError: handleImageError
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: "https://laravel.com/assets/img/welcome/docs-dark.svg",
                          alt: "Laravel documentation screenshot",
                          className: "hidden aspect-video h-full w-full flex-1 rounded-[10px] object-cover object-top drop-shadow-[0px_4px_34px_rgba(0,0,0,0.25)] dark:block"
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-16 -left-16 h-40 w-[calc(100%+8rem)] bg-gradient-to-b from-transparent via-white to-white dark:via-zinc-900 dark:to-zinc-900" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-6 lg:items-end", children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      id: "docs-card-content",
                      className: "flex items-start gap-6 lg:flex-col",
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16", children: /* @__PURE__ */ jsxs(
                          "svg",
                          {
                            className: "size-5 sm:size-6",
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            children: [
                              /* @__PURE__ */ jsx(
                                "path",
                                {
                                  fill: "#FF2D20",
                                  d: "M23 4a1 1 0 0 0-1.447-.894L12.224 7.77a.5.5 0 0 1-.448 0L2.447 3.106A1 1 0 0 0 1 4v13.382a1.99 1.99 0 0 0 1.105 1.79l9.448 4.728c.14.065.293.1.447.1.154-.005.306-.04.447-.105l9.453-4.724a1.99 1.99 0 0 0 1.1-1.789V4ZM3 6.023a.25.25 0 0 1 .362-.223l7.5 3.75a.251.251 0 0 1 .138.223v11.2a.25.25 0 0 1-.362.224l-7.5-3.75a.25.25 0 0 1-.138-.22V6.023Zm18 11.2a.25.25 0 0 1-.138.224l-7.5 3.75a.249.249 0 0 1-.329-.099.249.249 0 0 1-.033-.12V9.772a.251.251 0 0 1 .138-.224l7.5-3.75a.25.25 0 0 1 .362.224v11.2Z"
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "path",
                                {
                                  fill: "#FF2D20",
                                  d: "m3.55 1.893 8 4.048a1.008 1.008 0 0 0 .9 0l8-4.048a1 1 0 0 0-.9-1.785l-7.322 3.706a.506.506 0 0 1-.452 0L4.454.108a1 1 0 0 0-.9 1.785H3.55Z"
                                }
                              )
                            ]
                          }
                        ) }),
                        /* @__PURE__ */ jsxs("div", { className: "pt-3 sm:pt-5 lg:pt-0", children: [
                          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-black dark:text-white", children: "Documentation" }),
                          /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm/relaxed", children: "Laravel has wonderful documentation covering every aspect of the framework. Whether you are a newcomer or have prior experience with Laravel, we recommend reading our documentation from beginning to end." })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "svg",
                    {
                      className: "size-6 shrink-0 stroke-[#FF2D20]",
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      strokeWidth: "1.5",
                      children: /* @__PURE__ */ jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          d: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                        }
                      )
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://laracasts.com",
              className: "flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16", children: /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "size-5 sm:size-6",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("g", { fill: "#FF2D20", children: /* @__PURE__ */ jsx("path", { d: "M24 8.25a.5.5 0 0 0-.5-.5H.5a.5.5 0 0 0-.5.5v12a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5v-12Zm-7.765 5.868a1.221 1.221 0 0 1 0 2.264l-6.626 2.776A1.153 1.153 0 0 1 8 18.123v-5.746a1.151 1.151 0 0 1 1.609-1.035l6.626 2.776ZM19.564 1.677a.25.25 0 0 0-.177-.427H15.6a.106.106 0 0 0-.072.03l-4.54 4.543a.25.25 0 0 0 .177.427h3.783c.027 0 .054-.01.073-.03l4.543-4.543ZM22.071 1.318a.047.047 0 0 0-.045.013l-4.492 4.492a.249.249 0 0 0 .038.385.25.25 0 0 0 .14.042h5.784a.5.5 0 0 0 .5-.5v-2a2.5 2.5 0 0 0-1.925-2.432ZM13.014 1.677a.25.25 0 0 0-.178-.427H9.101a.106.106 0 0 0-.073.03l-4.54 4.543a.25.25 0 0 0 .177.427H8.4a.106.106 0 0 0 .073-.03l4.54-4.543ZM6.513 1.677a.25.25 0 0 0-.177-.427H2.5A2.5 2.5 0 0 0 0 3.75v2a.5.5 0 0 0 .5.5h1.4a.106.106 0 0 0 .073-.03l4.54-4.543Z" }) })
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "pt-3 sm:pt-5", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-black dark:text-white", children: "Laracasts" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm/relaxed", children: "Laracasts offers thousands of video tutorials on Laravel, PHP, and JavaScript development. Check them out, see for yourself, and massively level up your development skills in the process." })
                ] }),
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "size-6 shrink-0 self-center stroke-[#FF2D20]",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    strokeWidth: "1.5",
                    children: /* @__PURE__ */ jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        d: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                      }
                    )
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://laravel-news.com",
              className: "flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16", children: /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "size-5 sm:size-6",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsxs("g", { fill: "#FF2D20", children: [
                      /* @__PURE__ */ jsx("path", { d: "M8.75 4.5H5.5c-.69 0-1.25.56-1.25 1.25v4.75c0 .69.56 1.25 1.25 1.25h3.25c.69 0 1.25-.56 1.25-1.25V5.75c0-.69-.56-1.25-1.25-1.25Z" }),
                      /* @__PURE__ */ jsx("path", { d: "M24 10a3 3 0 0 0-3-3h-2V2.5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2V20a3.5 3.5 0 0 0 3.5 3.5h17A3.5 3.5 0 0 0 24 20V10ZM3.5 21.5A1.5 1.5 0 0 1 2 20V3a.5.5 0 0 1 .5-.5h14a.5.5 0 0 1 .5.5v17c0 .295.037.588.11.874a.5.5 0 0 1-.484.625L3.5 21.5ZM22 20a1.5 1.5 0 1 1-3 0V9.5a.5.5 0 0 1 .5-.5H21a1 1 0 0 1 1 1v10Z" }),
                      /* @__PURE__ */ jsx("path", { d: "M12.751 6.047h2a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-2A.75.75 0 0 1 12 7.3v-.5a.75.75 0 0 1 .751-.753ZM12.751 10.047h2a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-2A.75.75 0 0 1 12 11.3v-.5a.75.75 0 0 1 .751-.753ZM4.751 14.047h10a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-10A.75.75 0 0 1 4 15.3v-.5a.75.75 0 0 1 .751-.753ZM4.75 18.047h7.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-7.5A.75.75 0 0 1 4 19.3v-.5a.75.75 0 0 1 .75-.753Z" })
                    ] })
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "pt-3 sm:pt-5", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-black dark:text-white", children: "Laravel News" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm/relaxed", children: "Laravel News is a community driven portal and newsletter aggregating all of the latest and most important news in the Laravel ecosystem, including new package releases and tutorials." })
                ] }),
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: "size-6 shrink-0 self-center stroke-[#FF2D20]",
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    strokeWidth: "1.5",
                    children: /* @__PURE__ */ jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        d: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                      }
                    )
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800", children: [
            /* @__PURE__ */ jsx("div", { className: "flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16", children: /* @__PURE__ */ jsx(
              "svg",
              {
                className: "size-5 sm:size-6",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx("g", { fill: "#FF2D20", children: /* @__PURE__ */ jsx("path", { d: "M16.597 12.635a.247.247 0 0 0-.08-.237 2.234 2.234 0 0 1-.769-1.68c.001-.195.03-.39.084-.578a.25.25 0 0 0-.09-.267 8.8 8.8 0 0 0-4.826-1.66.25.25 0 0 0-.268.181 2.5 2.5 0 0 1-2.4 1.824.045.045 0 0 0-.045.037 12.255 12.255 0 0 0-.093 3.86.251.251 0 0 0 .208.214c2.22.366 4.367 1.08 6.362 2.118a.252.252 0 0 0 .32-.079 10.09 10.09 0 0 0 1.597-3.733ZM13.616 17.968a.25.25 0 0 0-.063-.407A19.697 19.697 0 0 0 8.91 15.98a.25.25 0 0 0-.287.325c.151.455.334.898.548 1.328.437.827.981 1.594 1.619 2.28a.249.249 0 0 0 .32.044 29.13 29.13 0 0 0 2.506-1.99ZM6.303 14.105a.25.25 0 0 0 .265-.274 13.048 13.048 0 0 1 .205-4.045.062.062 0 0 0-.022-.07 2.5 2.5 0 0 1-.777-.982.25.25 0 0 0-.271-.149 11 11 0 0 0-5.6 2.815.255.255 0 0 0-.075.163c-.008.135-.02.27-.02.406.002.8.084 1.598.246 2.381a.25.25 0 0 0 .303.193 19.924 19.924 0 0 1 5.746-.438ZM9.228 20.914a.25.25 0 0 0 .1-.393 11.53 11.53 0 0 1-1.5-2.22 12.238 12.238 0 0 1-.91-2.465.248.248 0 0 0-.22-.187 18.876 18.876 0 0 0-5.69.33.249.249 0 0 0-.179.336c.838 2.142 2.272 4 4.132 5.353a.254.254 0 0 0 .15.048c1.41-.01 2.807-.282 4.117-.802ZM18.93 12.957l-.005-.008a.25.25 0 0 0-.268-.082 2.21 2.21 0 0 1-.41.081.25.25 0 0 0-.217.2c-.582 2.66-2.127 5.35-5.75 7.843a.248.248 0 0 0-.09.299.25.25 0 0 0 .065.091 28.703 28.703 0 0 0 2.662 2.12.246.246 0 0 0 .209.037c2.579-.701 4.85-2.242 6.456-4.378a.25.25 0 0 0 .048-.189 13.51 13.51 0 0 0-2.7-6.014ZM5.702 7.058a.254.254 0 0 0 .2-.165A2.488 2.488 0 0 1 7.98 5.245a.093.093 0 0 0 .078-.062 19.734 19.734 0 0 1 3.055-4.74.25.25 0 0 0-.21-.41 12.009 12.009 0 0 0-10.4 8.558.25.25 0 0 0 .373.281 12.912 12.912 0 0 1 4.826-1.814ZM10.773 22.052a.25.25 0 0 0-.28-.046c-.758.356-1.55.635-2.365.833a.25.25 0 0 0-.022.48c1.252.43 2.568.65 3.893.65.1 0 .2 0 .3-.008a.25.25 0 0 0 .147-.444c-.526-.424-1.1-.917-1.673-1.465ZM18.744 8.436a.249.249 0 0 0 .15.228 2.246 2.246 0 0 1 1.352 2.054c0 .337-.08.67-.23.972a.25.25 0 0 0 .042.28l.007.009a15.016 15.016 0 0 1 2.52 4.6.25.25 0 0 0 .37.132.25.25 0 0 0 .096-.114c.623-1.464.944-3.039.945-4.63a12.005 12.005 0 0 0-5.78-10.258.25.25 0 0 0-.373.274c.547 2.109.85 4.274.901 6.453ZM9.61 5.38a.25.25 0 0 0 .08.31c.34.24.616.561.8.935a.25.25 0 0 0 .3.127.631.631 0 0 1 .206-.034c2.054.078 4.036.772 5.69 1.991a.251.251 0 0 0 .267.024c.046-.024.093-.047.141-.067a.25.25 0 0 0 .151-.23A29.98 29.98 0 0 0 15.957.764a.25.25 0 0 0-.16-.164 11.924 11.924 0 0 0-2.21-.518.252.252 0 0 0-.215.076A22.456 22.456 0 0 0 9.61 5.38Z" }) })
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "pt-3 sm:pt-5", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-black dark:text-white", children: "Vibrant Ecosystem" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-4 text-sm/relaxed", children: [
                "Laravel's robust library of first-party tools and libraries, such as",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://forge.laravel.com",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white dark:focus-visible:ring-[#FF2D20]",
                    children: "Forge"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://vapor.laravel.com",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Vapor"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://nova.laravel.com",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Nova"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://envoyer.io",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Envoyer"
                  }
                ),
                ", and",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://herd.laravel.com",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Herd"
                  }
                ),
                " ",
                "help you take your projects to the next level. Pair them with powerful open source libraries like",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/billing",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Cashier"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/dusk",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Dusk"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/broadcasting",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Echo"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/horizon",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Horizon"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/sanctum",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Sanctum"
                  }
                ),
                ",",
                " ",
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://laravel.com/docs/telescope",
                    className: "rounded-sm underline hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D20] dark:hover:text-white",
                    children: "Telescope"
                  }
                ),
                ", and more."
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("footer", { className: "py-16 text-center text-sm text-black dark:text-white/70", children: [
          "Laravel v",
          laravelVersion,
          " (PHP v",
          phpVersion,
          ")"
        ] })
      ] }) })
    ] })
  ] });
}
const __vite_glob_0_28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Welcome
}, Symbol.toStringTag, { value: "Module" }));
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var lib = {};
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  Object.defineProperty(lib, "__esModule", {
    value: true
  });
  lib.default = void 0;
  var process = _interopRequireWildcard(require$$0);
  var _http = require$$1;
  function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = /* @__PURE__ */ new WeakMap();
    var cacheNodeInterop = /* @__PURE__ */ new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop2) {
      return nodeInterop2 ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
  }
  function _interopRequireWildcard(obj, nodeInterop) {
    if (obj && obj.__esModule) {
      return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
      return { default: obj };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
      return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var key in obj) {
      if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
        var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
        if (desc && (desc.get || desc.set)) {
          Object.defineProperty(newObj, key, desc);
        } else {
          newObj[key] = obj[key];
        }
      }
    }
    newObj.default = obj;
    if (cache) {
      cache.set(obj, newObj);
    }
    return newObj;
  }
  const readableToString = (readable) => new Promise((resolve, reject) => {
    let data = "";
    readable.on("data", (chunk) => data += chunk);
    readable.on("end", () => resolve(data));
    readable.on("error", (err) => reject(err));
  });
  var _default = (render, port) => {
    const _port = port || 13714;
    const routes = {
      "/health": async () => ({
        status: "OK",
        timestamp: Date.now()
      }),
      "/shutdown": () => process.exit(),
      "/render": async (request) => render(JSON.parse(await readableToString(request))),
      "/404": async () => ({
        status: "NOT_FOUND",
        timestamp: Date.now()
      })
    };
    (0, _http.createServer)(async (request, response) => {
      const dispatchRoute = routes[request.url] || routes["/404"];
      try {
        response.writeHead(200, {
          "Content-Type": "application/json",
          "Server": "Inertia.js SSR"
        });
        response.write(JSON.stringify(await dispatchRoute(request)));
      } catch (e) {
        console.error(e);
      }
      response.end();
    }).listen(_port, () => console.log("Inertia SSR server started."));
    console.log(`Starting SSR server on port ${_port}...`);
  };
  lib.default = _default;
  return lib;
}
var libExports = requireLib();
const createServer = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
async function resolvePageComponent(path, pages) {
  for (const p of Array.isArray(path) ? path : [path]) {
    const page = pages[p];
    if (typeof page === "undefined") {
      continue;
    }
    return typeof page === "function" ? page() : page;
  }
  throw new Error(`Page not found: ${path}`);
}
const appName = "Harun.dev";
createServer((page) => {
  return createInertiaApp({
    page,
    render: async ({ component, props }) => {
      const pages = /* @__PURE__ */ Object.assign({ "./Pages/About.tsx": __vite_glob_0_0, "./Pages/Auth/ConfirmPassword.tsx": __vite_glob_0_1, "./Pages/Auth/ForgotPassword.tsx": __vite_glob_0_2, "./Pages/Auth/Login.tsx": __vite_glob_0_3, "./Pages/Auth/Register.tsx": __vite_glob_0_4, "./Pages/Auth/ResetPassword.tsx": __vite_glob_0_5, "./Pages/Auth/VerifyEmail.tsx": __vite_glob_0_6, "./Pages/Book.tsx": __vite_glob_0_7, "./Pages/Contact.tsx": __vite_glob_0_8, "./Pages/Dashboard.tsx": __vite_glob_0_9, "./Pages/Homepage.tsx": __vite_glob_0_10, "./Pages/Profile/Edit.tsx": __vite_glob_0_11, "./Pages/Profile/Partials/DeleteUserForm.tsx": __vite_glob_0_12, "./Pages/Profile/Partials/UpdatePasswordForm.tsx": __vite_glob_0_13, "./Pages/Profile/Partials/UpdateProfileInformationForm.tsx": __vite_glob_0_14, "./Pages/Services.tsx": __vite_glob_0_15, "./Pages/Services/AutomatedDeployment.tsx": __vite_glob_0_16, "./Pages/Services/CloudArchitecture.tsx": __vite_glob_0_17, "./Pages/Services/DatabaseMigration.tsx": __vite_glob_0_18, "./Pages/Services/DatabaseOptimization.tsx": __vite_glob_0_19, "./Pages/Services/DevOps.tsx": __vite_glob_0_20, "./Pages/Services/InfrastructureAsCode.tsx": __vite_glob_0_21, "./Pages/Services/InfrastructureMigration.tsx": __vite_glob_0_22, "./Pages/Services/MLOps.tsx": __vite_glob_0_23, "./Pages/Services/MonitoringObservability.tsx": __vite_glob_0_24, "./Pages/Services/PerformanceOptimization.tsx": __vite_glob_0_25, "./Pages/Services/SecurityConsulting.tsx": __vite_glob_0_26, "./Pages/Services/ServerlessInfrastructure.tsx": __vite_glob_0_27, "./Pages/Welcome.tsx": __vite_glob_0_28 });
      const resolvedComponent = await resolvePageComponent(
        `./Pages/${component}.tsx`,
        pages
      );
      const seoTags = {
        title: `${resolvedComponent.default.title || ""} | ${appName}`,
        meta: [
          {
            name: "description",
            content: resolvedComponent.default.description || ""
          },
          {
            name: "keywords",
            content: resolvedComponent.default.keywords || ""
          },
          {
            property: "og:title",
            content: resolvedComponent.default.title || ""
          },
          {
            property: "og:description",
            content: resolvedComponent.default.description || ""
          },
          {
            property: "og:type",
            content: "website"
          },
          {
            name: "twitter:card",
            content: "summary_large_image"
          },
          {
            name: "twitter:title",
            content: resolvedComponent.default.title || ""
          },
          {
            name: "twitter:description",
            content: resolvedComponent.default.description || ""
          }
        ]
      };
      const app = React__default.createElement(resolvedComponent.default, {
        ...props,
        seoTags
      });
      const body = renderToString(app);
      return {
        head: [],
        body
      };
    }
  });
});
