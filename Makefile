PUBLISH_DIR = /www/webonastick.com/htdocs/lc

default: sass

publish:
	ssh dse@webonastick.com "bash -c '\
		if [[ -e $(PUBLISH_DIR) ]] ; then \
			cd $(PUBLISH_DIR) && git checkout -- . && git pull && npm install ; \
		else \
			git clone git@github.com:dse/led-clock-2020.git $(PUBLISH_DIR) && cd $(PUBLISH_DIR) && npm install ; \
		fi'"

test:
	rsync -r -l -v -c -C --exclude=node_modules ./ dse@webonastick.com:$(PUBLISH_DIR)

sass:
	gulp sass
.PHONY: sass
