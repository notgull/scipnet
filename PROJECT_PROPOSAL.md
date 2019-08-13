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
* Cannot "preview" changes with CSS or certain templates.

**Platform:**  
* No means to change rating algorithm. (e.g. [wilson score confidence](http://www.evanmiller.org/how-not-to-sort-by-average-rating.html))
* No means to mask rating. (e.g. first 3 hours articles have hidden scores)
* It is possible to vote twice.
* Co-authorship, rewrites, and translations are handled through a manually-maintained "attribution data" page, rather than being first-class attributes of an article.

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
