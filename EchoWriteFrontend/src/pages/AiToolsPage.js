// frontend/src/pages/AiToolsPage.js (New File)
import React from 'react';
import AiGeneratorCard from '../components/ai/AiGeneratorCard';
import { Link } from 'react-router-dom';

const AiToolsPage = () => {
    const marketingEmailFields = [
        { name: 'productOrService', label: 'Product/Service Name or Description', type: 'textarea', rows: 2, required: true, placeholder: "e.g., EchoWrite - AI Content Repurposer" },
        { name: 'targetAudience', label: 'Target Audience', required: true, placeholder: "e.g., Content creators, bloggers, marketers" },
        { name: 'keyMessage', label: 'Key Message / Offer', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Save time by repurposing content with AI. Get 20% off." },
        { name: 'desiredTone', label: 'Desired Tone', placeholder: "e.g., Professional, friendly, urgent", required: true }
    ];

    const instagramCaptionFields = [
        { name: 'imageDescription', label: 'Describe Your Image/Post Topic', type: 'textarea', rows: 3, required: true, placeholder: "e.g., A laptop on a desk with a cup of coffee and a notebook." },
        { name: 'desiredVibe', label: 'Desired Vibe/Tone', required: true, placeholder: "e.g., Inspiring, funny, informative, casual" },
        { name: 'includeHashtags', label: 'Include Hashtags?', type: 'checkbox', defaultChecked: true }
    ];

    const blogIdeaFields = [
        { name: 'mainTopic', label: 'Main Topic or Keyword', required: true, placeholder: "e.g., Content marketing strategies" },
        { name: 'targetAudience', label: 'Target Audience (Optional)', placeholder: "e.g., Small business owners" }
    ];

    const coldEmailFields = [
        { name: 'productService', label: 'Your Product/Service', type: 'textarea', rows: 2, required: true, placeholder: "e.g., EchoWrite - AI Content Repurposer" },
        { name: 'targetPersona', label: 'Target Persona/Industry', required: true, placeholder: "e.g., SaaS founders, Marketing Managers in B2B Tech" },
        { name: 'painPoint', label: 'Their Key Pain Point', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Spending too much time manually creating social media posts." },
        { name: 'valueProposition', label: 'Your Unique Value Proposition', type: 'textarea', rows: 2, required: true, placeholder: "e.g., We help you repurpose one piece of content into 10+ posts in minutes using AI." },
        { name: 'callToAction', label: 'Desired Call to Action', required: true, placeholder: "e.g., Book a 15-min demo, Try our free plan" }
    ];

    const outlineFields = [
        { name: 'mainTopic', label: 'Main Topic for Outline', required: true, placeholder: "e.g., The Future of AI in Content Marketing" },
        { name: 'keywords', label: 'Key Keywords (comma-separated)', placeholder: "e.g., AI, content marketing, SEO, automation" },
        { name: 'targetAudience', label: 'Target Audience', placeholder: "e.g., Marketing professionals, business owners" },
        { name: 'desiredSections', label: 'Approx. Number of Main Sections', type: 'number', defaultValue: 5, placeholder: "e.g., 5" }
    ];

    const paragraphRewriteFields = [
        { name: 'originalParagraph', label: 'Paragraph to Rewrite', type: 'textarea', rows: 5, required: true },
        { name: 'rewriteInstruction', label: 'Rewrite Instruction', required: true, placeholder: "e.g., Make it more concise, Change to a formal tone, Simplify for a 5th grader" }
    ];

    const paragraphGenerateFields = [
        { name: 'topic', label: 'Topic/Subject of Paragraph', required: true },
        { name: 'keywords', label: 'Keywords to Include (comma-separated)', placeholder: "e.g., innovation, technology, future" },
        { name: 'desiredTone', label: 'Desired Tone', placeholder: "e.g., informative, persuasive, casual" },
        { name: 'desiredLength', label: 'Desired Length', type: 'select', options: ['short', 'medium', 'long'], defaultValue: 'medium' } // AiGeneratorCard needs to support select
    ];
    // Note: AiGeneratorCard would need to be enhanced to handle 'select' type inputs.
    // For now, you can use type: 'text' for desiredLength and user types "short", "medium", or "long".

    const productDescriptionFields = [ 
        { name: 'productName', label: 'Name of the Product', required: true },
        { name: 'features', label: 'Features to Include (comma-separated)', placeholder: "e.g., leather, casual, trendy" },
        { name: 'targetAudience', label: 'Target Audience', placeholder: "e.g., Fashion Enthusiasits , Models, Casual People" },
        { name: 'tone', label: 'Desired Tone', placeholder: "e.g., informative, persuasive, casual"}
    ];
    const sentenceRewriteFields = [ 
        { name: 'originalSentence', label: 'Sentence to Rewrite', required: true },
        { name: 'rewriteInstruction', label: 'Rewrite Instruction', required: true, placeholder: "e.g., Make it more concise, Change to a formal tone, Simplify for a 5th grader" }
    ];
    const metaDescriptionFields = [ 
        { name: 'pageTitle', label: 'Title of Page', required: true },
        { name: 'pageContentSummary', label: 'Summary of Page Content' },
        { name: 'keywords', label: 'Keywords', placeholder: "e.g., innovation , technology, service" }
     ];
    const sloganFields = [ 
        { name: 'companyOrProduct', label: 'Name of the Company/Product', required: true },
        { name: 'coreValues', label: 'Core Values', placeholder: "e.g., passionate, problem solving, innovative" },
        { name: 'targetAudience', label: 'Target Audience', placeholder: "e.g., Business Professionals, Consumers, Casual People" }
     ];
    // ... and so on for all other generators
    const contentIdeasFields = [
        { name: 'topic', label: 'Main Topic', required: true, placeholder: "e.g., AI in Content Marketing" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Marketing Managers" },
        { name: 'contentTypes', label: 'Content Types', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Blog posts, Social media, Videos" },
        { name: 'quantity', label: 'Number of Ideas', type: 'number', defaultValue: 5, required: true }
      ];
      
      const salesCopyFields = [
        { name: 'product', label: 'Product/Service', required: true, placeholder: "e.g., Smart Fitness Tracker" },
        { name: 'benefits', label: 'Key Benefits', type: 'textarea', rows: 2, required: true, placeholder: "e.g., 24/7 heart monitoring, Waterproof design" },
        { name: 'targetAudience', label: 'Target Audience', required: true, placeholder: "e.g., Fitness enthusiasts, Athletes" },
        { name: 'callToAction', label: 'Call to Action', required: true, placeholder: "e.g., Order now, Get 50% off" },
        { name: 'wordCount', label: 'Word Count', type: 'number', defaultValue: 200, required: true }
      ];
      
      const mottoFields = [
        { name: 'brand', label: 'Brand Name', required: true, placeholder: "e.g., TechNova" },
        { name: 'industry', label: 'Industry', required: true, placeholder: "e.g., AI Solutions" },
        { name: 'values', label: 'Core Values', type: 'textarea', rows: 2, placeholder: "e.g., Innovation, Integrity, Sustainability" },
        { name: 'tone', label: 'Desired Tone', required: true, placeholder: "e.g., Inspirational, Modern" },
        { name: 'quantity', label: 'Number of Options', type: 'number', defaultValue: 5, required: true }
      ];
      
      const adCopyFields = [
        { name: 'product', label: 'Product/Service', required: true, placeholder: "e.g., Project Management Software" },
        { name: 'platform', label: 'Advertising Platform', required: true, placeholder: "e.g., Facebook, Google Ads" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Project Managers, Teams" },
        { name: 'uniqueSellingPoints', label: 'Unique Selling Points', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Real-time collaboration, AI-powered insights" },
        { name: 'characterLimit', label: 'Character Limit', type: 'number', placeholder: "e.g., 280 for Twitter" }
      ];

      const hookFields = [
        { name: 'topic', label: 'Hook Topic', required: true, placeholder: "e.g., Morning routines" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Entrepreneurs" },
        { name: 'contentType', label: 'Content Type', required: true, placeholder: "e.g., Social media post" },
        { name: 'tone', label: 'Desired Tone', required: true, placeholder: "e.g., Dramatic, Inspirational" },
        { name: 'quantity', label: 'Number of Hooks', type: 'number', defaultValue: 5, required: true }
      ];
      
      const hashtagFields = [
        { name: 'postTopic', label: 'Post Topic', required: true, placeholder: "e.g., Healthy eating tips" },
        { name: 'niche', label: 'Industry/Niche', required: true, placeholder: "e.g., Fitness, Nutrition" },
        { name: 'location', label: 'Location (Optional)', placeholder: "e.g., New York, Global" },
        { name: 'trendLevel', label: 'Trend Level', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
        { name: 'quantity', label: 'Number of Hashtags', type: 'number', defaultValue: 15, required: true }
      ];
      
      const businessNameFields = [
        { name: 'industry', label: 'Industry', required: true, placeholder: "e.g., Tech, Fashion" },
        { name: 'keywords', label: 'Keywords', required: true, placeholder: "e.g., Cloud, Solutions" },
        { name: 'brandValues', label: 'Brand Values', type: 'textarea', rows: 2, placeholder: "e.g., Innovation, Trust" },
        { name: 'nameStyle', label: 'Naming Style', required: true, placeholder: "e.g., Modern, Classic" },
        { name: 'quantity', label: 'Number of Names', type: 'number', defaultValue: 10, required: true }
      ];
      
      const paraphraseFields = [
        { name: 'originalText', label: 'Original Text', type: 'textarea', rows: 4, required: true },
        { name: 'tone', label: 'Desired Tone', required: true, placeholder: "e.g., Formal, Casual" },
        { name: 'complexity', label: 'Complexity Level', type: 'select', options: ['Simple', 'Medium', 'Advanced'], required: true },
        { name: 'preserveKeywords', label: 'Keywords to Preserve', placeholder: "Comma-separated important terms" }
      ];
      
      const rewriteFields = [
        { name: 'originalText', label: 'Original Content', type: 'textarea', rows: 4, required: true },
        { name: 'purpose', label: 'Rewrite Purpose', required: true, placeholder: "e.g., Simplify, Formalize" },
        { name: 'style', label: 'Writing Style', required: true, placeholder: "e.g., Academic, Conversational" },
        { name: 'length', label: 'Desired Length', type: 'select', options: ['Short', 'Same', 'Longer'], required: true },
        { name: 'focusKeywords', label: 'Focus Keywords', placeholder: "Comma-separated keywords to emphasize" }
      ];
      
      const videoScriptFields = [
        { name: 'topic', label: 'Video Topic', required: true, placeholder: "e.g., Product demo" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Tech enthusiasts" },
        { name: 'duration', label: 'Video Duration', required: true, placeholder: "e.g., 2 minutes" },
        { name: 'style', label: 'Video Style', required: true, placeholder: "e.g., Explainer, Commercial" },
        { name: 'callToAction', label: 'Call to Action', required: true, placeholder: "e.g., Visit our website" }
      ];
      
      const icebreakerFields = [
        { name: 'prospectInfo', label: 'Prospect Details', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Marketing Manager at SaaS company" },
        { name: 'context', label: 'Contact Context', required: true, placeholder: "e.g., Cold outreach for CRM tool" },
        { name: 'tone', label: 'Desired Tone', required: true, placeholder: "e.g., Friendly, Professional" },
        { name: 'quantity', label: 'Number of Icebreakers', type: 'number', defaultValue: 5, required: true }
      ];
      
      const youtubeFields = [
        { name: 'videoTopic', label: 'Video Topic', required: true, placeholder: "e.g., AI in Marketing" },
        { name: 'targetAudience', label: 'Target Audience', required: true, placeholder: "e.g., Marketers" },
        { name: 'competitors', label: 'Competitor Channels (Optional)', placeholder: "e.g., TechCrunch, MarTech" },
        { name: 'descriptionLength', label: 'Description Length', type: 'select', options: ['Short', 'Medium', 'Long'], required: true }
      ];
      
      const transcriptFields = [
        { name: 'transcript', label: 'Transcript Text', type: 'textarea', rows: 6, required: true },
        { name: 'contentType', label: 'Content Type', required: true, placeholder: "e.g., Blog post, Social media" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Industry professionals" },
        { name: 'keyPoints', label: 'Key Points to Highlight', type: 'textarea', rows: 2 }
      ];
      
      const webinarBriefFields = [
        { name: 'topic', label: 'Webinar Topic', required: true, placeholder: "e.g., AI in Healthcare" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Healthcare professionals" },
        { name: 'goals', label: 'Webinar Goals', type: 'textarea', rows: 2, required: true, placeholder: "e.g., Generate leads, Educate" },
        { name: 'speakerInfo', label: 'Speaker Info', required: true, placeholder: "e.g., Dr. Smith, AI Expert" },
        { name: 'duration', label: 'Webinar Duration', required: true, placeholder: "e.g., 60 minutes" }
      ];
      
      const nameFields = [
        { name: 'nameType', label: 'Name Type', required: true, placeholder: "e.g., First names, Full names" },
        { name: 'gender', label: 'Gender (Optional)', placeholder: "e.g., Male, Female, Neutral" },
        { name: 'origin', label: 'Origin/Culture (Optional)', placeholder: "e.g., Japanese, Arabic" },
        { name: 'quantity', label: 'Number of Names', type: 'number', defaultValue: 10, required: true },
        { name: 'uniqueness', label: 'Uniqueness Level', type: 'select', options: ['Common', 'Unique', 'Rare'], required: true }
      ];
      
      const usernameFields = [
        { name: 'keywords', label: 'Base Keywords', required: true, placeholder: "e.g., tech, cloud" },
        { name: 'nameStyle', label: 'Style', required: true, placeholder: "e.g., Professional, Cool" },
        { name: 'platform', label: 'For Platform', placeholder: "e.g., Instagram, GitHub" },
        { name: 'quantity', label: 'Number of Options', type: 'number', defaultValue: 10, required: true }
      ];
      
      const salesEmailFields = [
        { name: 'product', label: 'Product/Service', required: true, placeholder: "e.g., Project Management Tool" },
        { name: 'prospect', label: 'Prospect Details', required: true, placeholder: "e.g., CTO at Startup" },
        { name: 'painPoints', label: 'Pain Points', type: 'textarea', rows: 2, placeholder: "e.g., Team collaboration issues" },
        { name: 'callToAction', label: 'Call to Action', required: true, placeholder: "e.g., Schedule demo" },
        { name: 'emailLength', label: 'Email Length', type: 'select', options: ['Short', 'Medium', 'Long'], required: true }
      ];
      
      const webinarTitleFields = [
        { name: 'topic', label: 'Webinar Topic', required: true, placeholder: "e.g., Digital Marketing Trends" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Marketing Managers" },
        { name: 'keyBenefits', label: 'Key Attendee Benefits', type: 'textarea', rows: 2, required: true },
        { name: 'tone', label: 'Desired Tone', required: true, placeholder: "e.g., Professional, Engaging" },
        { name: 'quantity', label: 'Number of Titles', type: 'number', defaultValue: 5, required: true }
      ];
      
      const blogTitleFields = [
        { name: 'topic', label: 'Blog Topic', required: true, placeholder: "e.g., Content Strategy" },
        { name: 'audience', label: 'Target Audience', required: true, placeholder: "e.g., Content Creators" },
        { name: 'keywords', label: 'SEO Keywords (Optional)', placeholder: "e.g., SEO, blogging" },
        { name: 'tone', label: 'Title Tone', required: true, placeholder: "e.g., Catchy, Informative" },
        { name: 'quantity', label: 'Number of Titles', type: 'number', defaultValue: 5, required: true }
      ];
      
      const seoTitleFields = [
        { name: 'topic', label: 'Page Topic', required: true, placeholder: "e.g., Email Marketing" },
        { name: 'targetKeywords', label: 'Target Keywords', required: true, placeholder: "e.g., email campaigns" },
        { name: 'searchIntent', label: 'Search Intent', type: 'select', options: ['Informational', 'Commercial', 'Transactional'], required: true },
        { name: 'competitors', label: 'Competitor Titles (Optional)', type: 'textarea', rows: 2 },
        { name: 'quantity', label: 'Number of Titles', type: 'number', defaultValue: 5, required: true }
      ];
      
      const acronymFields = [
        { name: 'phrase', label: 'Phrase to Acronymize', required: true, placeholder: "e.g., Artificial Intelligence" },
        { name: 'purpose', label: 'Acronym Purpose', required: true, placeholder: "e.g., Brand name, Project code" },
        { name: 'style', label: 'Style Preference', required: true, placeholder: "e.g., Technical, Playful" },
        { name: 'alternatives', label: 'Number of Alternatives', type: 'number', defaultValue: 3, required: true }
      ];

    return (
        <div className="max-w-5xl mx-auto mt-8 p-4 md:p-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100">AI Content Generators</h1>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-300">Unleash creativity with our suite of AI-powered writing tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AiGeneratorCard
                    title="Marketing Email Generator"
                    description="Craft effective marketing emails in minutes."
                    inputFields={marketingEmailFields}
                    endpoint="/ai/generate-marketing-email"
                    resultProcessor={(data) => data.email} // Extracts the 'email' string from response
                    generatorType="marketing-email" 
                />
                <AiGeneratorCard
                    title="Instagram Caption Generator"
                    description="Create engaging Instagram captions instantly."
                    inputFields={instagramCaptionFields}
                    endpoint="/ai/generate-ig-captions"
                    resultProcessor={(data) => data.captions} // Expects an array of strings
                    generatorType="instagram-caption"
                />
                <AiGeneratorCard
                    title="Blog Post Idea Generator"
                    description="Get inspired with fresh blog post ideas."
                    inputFields={blogIdeaFields}
                    endpoint="/ai/generate-blog-ideas"
                    resultProcessor={(data) => data.ideas} // Expects an array of strings
                    generatorType="blog-idea"
                />
                {/* Add more AiGeneratorCard instances for other tools */}
                 {/* New Generators */}
                 <AiGeneratorCard
                    title="Cold Email Generator"
                    description="Generate effective cold emails instantly."
                    inputFields={coldEmailFields}
                    endpoint="/ai/generate-cold-email"
                    resultProcessor={(data) => data.email}
                    generatorType="cold-email"
                />
                <AiGeneratorCard
                    title="Content Outline Generator"
                    description="From blank page to full outline in minutes."
                    inputFields={outlineFields}
                    endpoint="/ai/generate-outline"
                    resultProcessor={(data) => data.outline}
                    generatorType="content-outline"
                />
                <AiGeneratorCard
                    title="Paragraph Rewriter"
                    description="Rewrite paragraphs with your instructions."
                    inputFields={paragraphRewriteFields}
                    endpoint="/ai/rewrite-paragraph" // You'll need to create this route and service
                    resultProcessor={(data) => data.rewrittenParagraph}
                    generatorType="paragraph-rewriter"
                />
                <AiGeneratorCard
                    title="Paragraph Generator"
                    description="Generate complete paragraphs from a topic."
                    inputFields={paragraphGenerateFields}
                    endpoint="/ai/generate-paragraph" // You'll need to create this
                    resultProcessor={(data) => data.paragraph}
                />
                {/* ... Add AiGeneratorCard for Product Descriptions ... */}
                <AiGeneratorCard
                    title="Product Description Generator"
                    description="Generate product description."
                    inputFields={productDescriptionFields}
                    endpoint="/ai/generate-product-description" // You'll need to create this
                    resultProcessor={(data) => data.description}
                />
                {/* ... Add AiGeneratorCard for Sentence Rewriter ... */}
                <AiGeneratorCard
                    title="Sentence Rewriter"
                    description="Rewrite sentences."
                    inputFields={sentenceRewriteFields}
                    endpoint="/ai/rewrite-sentence" // You'll need to create this
                    resultProcessor={(data) => data.rewrittenSentence}
                />
                {/* ... Add AiGeneratorCard for Meta Descriptions ... */}
                <AiGeneratorCard
                    title="Meta Description Generator"
                    description="Generate meta description for your pages."
                    inputFields={metaDescriptionFields}
                    endpoint="/ai/generate-meta-description" // You'll need to create this
                    resultProcessor={(data) => data.metaDescription}
                />
                {/* ... Add AiGeneratorCard for Slogans ... */}
                <AiGeneratorCard
                    title="Slogans Generator"
                    description="Generate slogans for your company or product."
                    inputFields={sloganFields}
                    endpoint="/ai/generate-slogan" // You'll need to create this
                    resultProcessor={(data) => data.slogans}
                />

                {/* CONTINUE ADDING CARDS FOR EACH GENERATOR */}
                <AiGeneratorCard
    title="Content Ideas Generator"
    description="Brainstorm fresh content ideas tailored to your audience"
    inputFields={contentIdeasFields}
    endpoint="/ai/generate-content-ideas"
    resultProcessor={(data) => data.ideas}
  />

  <AiGeneratorCard
    title="Sales Copy Generator"
    description="Create high-converting sales copy for your products"
    inputFields={salesCopyFields}
    endpoint="/ai/generate-sales-copy"
    resultProcessor={(data) => data.salesCopy}
  />

  <AiGeneratorCard
    title="Motto/Slogan Generator"
    description="Craft memorable brand mottos and slogans"
    inputFields={mottoFields}
    endpoint="/ai/generate-motto"
    resultProcessor={(data) => data.mottos}
  />

  <AiGeneratorCard
    title="Ad Copy Generator"
    description="Generate platform-specific advertising copy"
    inputFields={adCopyFields}
    endpoint="/ai/generate-ad-copy"
    resultProcessor={(data) => data.adCopy}
  />

  {/* Add similar cards for other routes... */}
  <AiGeneratorCard
    title="FAQ Generator"
    description="Create comprehensive FAQ sections"
    inputFields={[
      { name: 'topic', label: 'Main Topic', required: true },
      { name: 'audience', label: 'Target Audience', required: true },
      { name: 'commonConcerns', label: 'Common Concerns', type: 'textarea', rows: 3 },
      { name: 'depth', label: 'Detail Level', type: 'select', options: ['Basic', 'Detailed', 'Comprehensive'] }
    ]}
    endpoint="/ai/generate-faq-schema"
    resultProcessor={(data) => data.faqContent}
  />

  <AiGeneratorCard
    title="Text Humanizer"
    description="Make AI text sound more natural"
    inputFields={[
      { name: 'aiText', label: 'AI Generated Text', type: 'textarea', rows: 4, required: true },
      { name: 'tone', label: 'Desired Tone', required: true },
      { name: 'complexity', label: 'Complexity Level', type: 'select', options: ['Simple', 'Medium', 'Advanced'] }
    ]}
    endpoint="/ai/humanize-text"
    resultProcessor={(data) => data.humanizedText}
  />

<AiGeneratorCard
    title="Hook Generator"
    description="Create attention-grabbing hooks for content"
    inputFields={hookFields}
    endpoint="/ai/generate-hook"
    resultProcessor={(data) => data.hooks}
  />

  <AiGeneratorCard
    title="Instagram Hashtags"
    description="Generate trending hashtags for posts"
    inputFields={hashtagFields}
    endpoint="/ai/generate-instagram-hashtags"
    resultProcessor={(data) => data.hashtags}
  />

  <AiGeneratorCard
    title="Business Name Generator"
    description="Find the perfect name for your business"
    inputFields={businessNameFields}
    endpoint="/ai/generate-business-name"
    resultProcessor={(data) => data.businessNames}
  />

  <AiGeneratorCard
    title="Text Paraphraser"
    description="Rephrase text while preserving meaning"
    inputFields={paraphraseFields}
    endpoint="/ai/paraphrase-text"
    resultProcessor={(data) => data.paraphrasedText}
  />

  <AiGeneratorCard
    title="Content Rewriter"
    description="Rewrite existing content with new style"
    inputFields={rewriteFields}
    endpoint="/ai/rewrite-content"
    resultProcessor={(data) => data.rewrittenContent}
  />

  <AiGeneratorCard
    title="Video Script Generator"
    description="Create professional video scripts"
    inputFields={videoScriptFields}
    endpoint="/ai/generate-video-script"
    resultProcessor={(data) => data.videoScript}
  />

  <AiGeneratorCard
    title="FAQ Generator"
    description="Build comprehensive FAQ sections"
    inputFields={[
      { name: 'topic', label: 'Main Topic', required: true },
      { name: 'audience', label: 'Target Audience', required: true },
      { name: 'commonConcerns', label: 'Common Concerns', type: 'textarea', rows: 3 },
      { name: 'depth', label: 'Detail Level', type: 'select', options: ['Basic', 'Detailed', 'Comprehensive'] }
    ]}
    endpoint="/ai/generate-faq-schema"
    resultProcessor={(data) => data.faqContent}
  />

  <AiGeneratorCard
    title="Icebreaker Generator"
    description="Create personalized outreach icebreakers"
    inputFields={icebreakerFields}
    endpoint="/ai/generate-icebreakers"
    resultProcessor={(data) => data.icebreakers}
  />

  <AiGeneratorCard
    title="YouTube Optimizer"
    description="Generate keywords & descriptions"
    inputFields={youtubeFields}
    endpoint="/ai/generate-youtube-keywords"
    resultProcessor={(data) => data.youtubeKeywords}
  />

  <AiGeneratorCard
    title="Transcript Converter"
    description="Transform transcripts into content"
    inputFields={transcriptFields}
    endpoint="/ai/create-content-from-transcript"
    resultProcessor={(data) => data.content}
  />

  <AiGeneratorCard
    title="Webinar Brief Generator"
    description="Create detailed webinar briefs"
    inputFields={webinarBriefFields}
    endpoint="/ai/create-webinar-brief"
    resultProcessor={(data) => data.webinarBrief}
  />

  <AiGeneratorCard
    title="Name Generator"
    description="Generate random names"
    inputFields={nameFields}
    endpoint="/ai/generate-random-names"
    resultProcessor={(data) => data.randomNames}
  />

  <AiGeneratorCard
    title="Username Generator"
    description="Find available usernames"
    inputFields={usernameFields}
    endpoint="/ai/generate-usernames"
    resultProcessor={(data) => data.usernames}
  />

  <AiGeneratorCard
    title="Sales Email Generator"
    description="Create high-converting sales emails"
    inputFields={salesEmailFields}
    endpoint="/ai/generate-sales-email"
    resultProcessor={(data) => data.salesEmail}
  />

  <AiGeneratorCard
    title="Webinar Title Generator"
    description="Generate compelling webinar titles"
    inputFields={webinarTitleFields}
    endpoint="/ai/generate-webinar-title"
    resultProcessor={(data) => data.webinarTitles}
  />

  <AiGeneratorCard
    title="Blog Title Generator"
    description="Create click-worthy blog titles"
    inputFields={blogTitleFields}
    endpoint="/ai/generate-blog-title"
    resultProcessor={(data) => data.blogTitles}
  />

  <AiGeneratorCard
    title="SEO Title Generator"
    description="Optimize titles for search engines"
    inputFields={seoTitleFields}
    endpoint="/ai/generate-seo-title"
    resultProcessor={(data) => data.seoTitles}
  />

  <AiGeneratorCard
    title="Acronym Generator"
    description="Create meaningful acronyms"
    inputFields={acronymFields}
    endpoint="/ai/generate-acronym"
    resultProcessor={(data) => data.acronyms}
  />


            </div>
             <div className="mt-12 text-center">
                 <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
                     ← Back to Dashboard
                 </Link>
             </div>
        </div>
    );
};

export default AiToolsPage;