# Product Requirements Document (PRD)

**Product Name:** Family Fabric (Working Title)

**Document Version:** 1.0 (Production-Ready for AI-Native Engineering)

**Target Architecture Stack:** AI-Native SDLC Framework (Next.js / TypeScript / Supabase / Claude Code deployment)

---

## 1. Problem Statement & Executive Summary

Modern extended families are highly distributed across global geographies and generations. While daily micro-communications happen sporadically on platforms like WhatsApp, they lack structural continuity. Precious family memories, deep lineage data (maternal and paternal), childhood photographs, and historical milestones are lost in ephemeral chat history.

Existing market alternatives fail to solve this comprehensively:

* **Genealogy platforms** (MyHeritage, Ancestry) serve as rigid, sterile historical databases rather than active emotional hubs.
* **Media sharing platforms** (FamilyAlbum, Tinybeans) target immediate parental-child milestones but lack multi-generational relational trees.

**The Solution:** An elite, completely private cross-platform application (Web/Mobile) that serves as the definitive center of gravity for a large family. It acts as an active, AI-assisted repository that transforms unstructured daily fragments into a structured, living chronological history.

---

## 2. Product Vision & Personas

### Product Vision

To weave an intergenerational "Love Fabric"—a digital sanctuary that autonomously preserves legacy, streamlines communication, and utilizes intelligent automation to foster meaningful family connections regardless of physical distance.

### User Personas

The application is designed to support three highly disparate user profiles, demanding a highly adaptive UI/UX:

```
+-------------------------------------------------------------------------+
|                            USER PERSONAS                                |
+------------------------------------+------------------------------------+
| 1. The Family Historian            | * Profile: Elders / Grandparents   |
|                                    | * Needs: Large tap targets, voice  |
|                                    |   inputs, hyper-clear typography.  |
+------------------------------------+------------------------------------+
| 2. The Busy Professional           | * Profile: Active working core     |
|                                    | * Needs: Zero-friction friction,  |
|                                    |   digest notifications via chat.   |
+------------------------------------+------------------------------------+
| 3. The Digital Contributor         | * Profile: Gen-Z / Millennials     |
|                                    | * Needs: Fast media uploads, AI    |
|                                    |   face filters, rich UI.           |
+------------------------------------+------------------------------------+

```

---

## 3. Core Epics & Technical Requirements

To make this immediately actionable for an AI-native code generator (such as Claude Code), the requirements are broken down into specific functional blocks.

### Epic 1: The Roots (Dual Lineage Family Tree)

* **System Requirement:** Implement a highly interactive, fluid graph layout capable of mapping both **Maternal** and **Paternal** lines from a single logged-in user node.
* **Data Models:** Nodes must support comprehensive metadata profiles including:
* Full Name (Legal and Chosen/Nicknames)
* Date of Birth & Date of Passing (with toggle logic)
* Current Geo-location (City, Country)
* Dynamic relational links: Parent, Spouse, Child, Sibling (supporting multi-spouse/divorce/adoption configurations seamlessly).



### Epic 2: The Vault (AI-Powered Media Management)

* **Facial Recognition Pipeline:** Media storage must be bound to an asynchronous facial recognition workflow.
* *Mechanism:* When a user uploads a high-resolution photo asset, a background worker triggers an open-source face detection/clustering model (e.g., face-api.js or serverless deep learning endpoints).
* *Action:* It clusters unrecognized faces, allowing the admin to tie a face profile directly to a node id from the Family Tree. Once associated, clicking any person's face filters the global gallery down to their specific historical footprints.


* **Sequential Timeline UI:** A vertical, infinitely scrollable feed tracking memories from historical childhood epochs to present-day high-definition media uploads.

### Epic 3: The Bridge (Non-Intrusive WhatsApp Sync Engine)

Given the strict overhead of official WhatsApp Business APIs for private use, the communication engine relies on an elegant, semi-automated parsing mechanism:

1. **Inbound Communication Routing:** Leveraging automated incoming parsing.
Set up a dedicated cloud-hosted incoming webhook endpoint linked to an automated Matrix/Puppeteer web automation runner or an enterprise-grade utility phone number.


2. **Message and Media Extraction:** Data ingestion layer.
The engine monitors incoming data for keyword payloads (e.g., #save, #birthday, #memory) or parsed image assets sent directly inside the configured family group.


3. **AI Extraction & Normalization:** LLM Structuring Phase.
Pass the unstructured text and media through an LLM payload parser. Extract the active event type, the targeted person's name, and structural text data.


4. **Staging & Verification Queue:** Human-in-the-loop review.
Before appending directly to the core database, route the extracted memory to a "Pending Approvals" staging card layout inside the app dashboard for a designated Family Admin to verify.


### Epic 4: The Pulse (Automated Engagement & Culturally Aware Alerts)

* **Notification Dispatch:** Cron-based scheduling system calculating birthdays, wedding anniversaries, and key cultural holidays.
* **Cultural Specificity:** The system must natively support tracking variable lunar/solar dates (such as regional festival calendars) and send automated prompt-driven greeting templates to the family group chat.

---

## 4. Technical Innovation Roadmap (Value-Add Enhancements)

Beyond a standard application database, the MVP code structure should contain hooks for these advanced modules:

| Feature Module | Technical Mechanism | Impact Level |
| --- | --- | --- |
| **AI "Family Newsletter" Summaries** | Weekly scheduled LLM batch job that groups all ingested chat logs, new photo tags, and travel logs into a structured markdown email. | **High** (Keeps busy members fully connected passively) |
| **The Heritage Recipe Vault** | Dedicated structured taxonomy for documenting ancestral recipes (e.g., exact proportions for traditional regional pickles or custom masala combinations), including video links and step-by-step instructions. | **Medium** (Preserves cultural identity across generations) |
| **Voice Memory Transcripts** | Web Audio API recording interface enabling elder generations to speak directly to the app. Feeds into an automated Whisper transcription engine to save text alongside raw audio. | **Critical** (Captures acoustic heritage before it is lost) |
| **Geospatial Proximity Map** | Leaflet/Mapbox vector layer rendering approximate member nodes based on profile city data, enabling dynamic cross-border travel notifications. | **Low** (Enhances real-world physical coordinates connect) |

---

## 5. Non-Functional Requirements & Security Protocols

* **Zero Public Exposure:** The entire repository and host domain must sit behind explicit authentication shields (NextAuth or Supabase Auth). Public search crawlers (`robots.txt`) must be rigidly restricted.
* **Data Portability & Sovereign Export:** A single-button utility must exist within the Admin Panel to export the full PostgreSQL schema, nested relational JSON files, and original resolution media directories as a single compressed archival package.
* **Image Optimization on Edge:** Real-time optimization processing must scale images dynamically to minimize mobile browser rendering latency for older hardware devices used by elder generations.

---

## 6. Development Phasing for AI-Native Tools

When initializing code generation with tools like Claude Code, execute development strictly in the following sequence:

```
+-----------------------------------------------------------------+
|                    PHASED DEVELOPMENT WORKFLOW                  |
+-----------------------------------------------------------------+
| Phase 1: Core Architecture & Database Schema Definition         |
| -> Run database migrations for Tree Nodes, Relations, & Media. |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
| Phase 2: Web & Mobile Responsive Frontend Layout Assembly      |
| -> Build the Dual Lineage Family Tree graph view UI components. |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
| Phase 3: AI Facial Recognition Integration & Cloud Storage Hooks|
| -> Wire up photo uploading with background face-clustering.     |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
| Phase 4: Staging Webhooks & Ingestion Queue Finalization        |
| -> Complete the mock WhatsApp parser and data normalization system. |
+-----------------------------------------------------------------+

```