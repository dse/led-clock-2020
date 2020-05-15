default: sass

publish:
	ssh dse@webonastick.com "bash -c 'cd /www/webonastick.com/htdocs/lc/ && git checkout -- . && git pull && npm install'"

test:
	rsync -r -l -v -c -C --exclude=node_modules ./ dse@webonastick.com:/www/webonastick.com/htdocs/lc/

sass:
	gulp sass
.PHONY: sass
