# Test Plan Outline
## Story Description
For JIRA story https://justeattakeaway.atlassian.net/browse/SON-2859 - Add docs to component pages:
    
## Test Plan
    For each Component in https://sonic.staging.jet-internal.com/components:
        Validate {component} has a tab Docs
        Validate the Docs tab is tagged with label Beta
        Validate that for each Document in https://sonic.staging.jet-internal.com/docs there is a matching Component with a Docs tab
        Validate that the Docs tab displays the document
        Verify a sample of each component type contains the correct Doc
        Verify that each of these Docs are well formatted

## Implement Tests
Capture bearer token from https://sonic.staging.jet-internal.com/
Capture json response from GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/catalog/applications
    This occurs when https://sonic.staging.jet-internal.com/components is loaded
    Filter json response to create a list of Application Names from the json defined in "name"
Capture json response from GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/static/docs/metadata/component
    This occurs when https://sonic.staging.jet-internal.com/docs is loaded
    Filter json response to create a list of Document Names from the json defined in "title"
Compare the two lists where every Document should match to a Component by name ignoring "-" or case and generate a comparison file listing each Component and which have a Document match
Add to the file the URLs for each Component following the pattern https://sonic.staging.jet-internal.com/components/{name}/
Add to the file the URLs for each Component with a Docs tab following the pattern https://sonic.staging.jet-internal.com/components/{name}/docs
Use the Docs tab URLs to test that GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/user-interactions/analytics/component%2F{name}%2Findex.html generates a 200 response
Test for dead links using the list of Doc tab URLS in the file