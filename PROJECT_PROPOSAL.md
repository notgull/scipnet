# Project Proposal
A discussion document to look at the various requirements, potential solutions, and structures this project may have.

## Wikidot Problem Statements
Compilation of issues faced by site users, readers, and moderators when interacting with Wikidot.com sites.

**Moderation:**  
* Cannot make "closed" posts that cannot be responded to.
* Cannot easily "port" comments or posts, either for running deletions or for disciplinary discussion.
* Tags are freeform, allowing typos/invalid tags, or allowing tag combinations which conflict. (e.g. scp and tale)
* Managing malicious voting, voting by deleted accounts, backing up/restoring votes.

**Usability:**  
* Overly vague/ambiguous error messages which prompts new users to attempt the wrong solutions.
* Creating a new article has several manual steps, which can be interrupted by other users. (submit, author post, series title, tags, etc.)
* No auto-saving PM drafts, clicking cancel or back will cause loss of data.
* No WYSIWYG editor.
* Cannot segregate pages by author(s), necessitating use of tabs within public sandboxes.
* Cannot "preview" changes with CSS or certain templates.
* Diffs with few changed lines do not collapse unchanged segments, requiring lots of scrolling.
* Diffs use some kind of weird word-based changes, displaying unmodified surrounding text as removed then added.

**Platform:**  
* No means to change rating algorithm. (e.g. [wilson score confidence](http://www.evanmiller.org/how-not-to-sort-by-average-rating.html))
* No means to mask rating. (e.g. first 3 hours articles have hidden scores)
* It is possible to vote twice.
* Co-authorship, rewrites, and translations are handled through a manually-maintained "attribution data" page, rather than being first-class attributes of an article.
* Components require weird hacks to add conditional segments, formatted text arguments, etc.
* No means to "neutral-vote".

**Code:**  
* Poor API support. (e.g. no article IDs, no means to fetch individual revisions, etc.)
* Difficult to modularly add new features or bugfixes.

## Code Structure
Wikidot is inherently a static site generator, with a small amount of scripting to handle dynamic actions such as collapsibles or user interactions.
Therefore, a single-page app solution is not a good fit. The project should be primarily about combining input information and producing an HTML file with associated JS/CSS bundles.

**Frontend:**  
* JS compilation / babel / something? (JS actions, collapsibles, etc.)

**Backend:**  
* web middleware (auth, routing, etc.)
* ftml (source parsing and rendering)
* page generation / bundling

**Auxiliary services:**
* page storage and requests (also handles diffs, metadata, etc.)
* email server/verification
* audit logging
* API gateway?

## Use Configurations
The way Wikidot is presently used falls into one of three categories:

**Article host** (Example: http://scp-wiki.net)  
Hosts articles and is dedicated to voting and discussion of them.
* Can vote on pages.
* Has discussion pages.
* Members can edit all regular pages.

**Sandbox** (Example: http://scp-sandbox-3.wikidot.com)  
Allows authors to create pages and change their contents freely.
* No voting on pages.
* No discussion pages.
* Members can only edit pages they have created or have been given explicit access to.

**Administrative** (Example: http://05command.wikidot.com)  
Record-keeping and site information pages.
* No voting on pages.
* No discussion pages.
* Allows staff voting on proposals.
* Possibly exposing forums in a structured way for easier scraping? (e.g. proposals, user records)

These workflows should be explicitly supported within the project, and should be configurable. Ideally premade configurations for similar setups to the above are included with the source, permitting easy local deployment of custom private sandboxes, etc.
