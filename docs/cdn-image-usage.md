# CDN Image Usage Guide

This document explains how to use the CDN URL for local image references in production.

## Overview

The project now includes a utility to automatically use CDN URLs for local image references in production. This means that in development, images will be served from the local server, but in production, they will be served from a CDN.

## How It Works

1. A utility function `getImageUrl()` has been added to `/resources/js/lib/imageUtils.ts`
2. A wrapper component `Image` has been added to `/resources/js/Components/Image.tsx`
3. The CDN URL is configured in the `.env` file using the `VITE_CDN_URL` variable
4. In production, the deployment script will use the CDN URL for local image references

## Usage

### Option 1: Use the Image Component (Recommended)

Replace your existing `<img>` tags with the `<Image>` component:

```tsx
import { Image } from '../Components/Image';

// Before
<img src="/images/aws-certifications.png" alt="AWS Certifications" />

// After
<Image src="/images/aws-certifications.png" alt="AWS Certifications" />
```

### Option 2: Use the getImageUrl Function

If you need more control or can't use the Image component:

```tsx
import { getImageUrl } from '../lib/imageUtils';

// Before
<img src="/images/aws-certifications.png" alt="AWS Certifications" />

// After
<img src={getImageUrl('/images/aws-certifications.png')} alt="AWS Certifications" />
```

## Configuration

1. In development, set `VITE_CDN_URL=` (empty) in your `.env` file to use local paths
2. In production, set `VITE_CDN_URL=https://cdn.harun.dev` (or your actual CDN URL) in your `.env.appprod` file

## CDN Setup

To complete the setup, you need to:

1. Configure your CDN to serve files from your server's `/public` directory
2. Update your deployment script to upload static assets to the CDN
3. Ensure your CDN is properly caching static assets

## Deployment

The deployment script already includes integration with Cloudflare for CDN caching and AWS S3/R2 bucket for storing build assets. The script has been updated to use the CDN URL for local image references in production.

## Existing Integration

Your project already includes:
- AWS S3/R2 bucket integration for storing build assets
- Cloudflare CDN integration for caching

This new utility leverages these existing integrations to provide a seamless experience for using CDN URLs in production.
