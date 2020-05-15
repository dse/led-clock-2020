GIT_REMOTE   = git@github.com:dse/led-clock-2020.git
PUBLISH_DEST = dse@webonastick.com # for ssh
PUBLISH_DIR  = /www/webonastick.com/htdocs/lc

default: sass

publish:
	ssh $(PUBLISH_DEST) "bash -c '\
		if [[ -e $(PUBLISH_DIR) ]] ; then \
			cd $(PUBLISH_DIR) && git checkout -- . && git pull && npm install ; \
		else \
			git clone $(GIT_REMOTE) $(PUBLISH_DIR) && cd $(PUBLISH_DIR) && npm install ; \
		fi \
	'"

test:
	rsync -r -l -v -c -C --exclude=node_modules ./ $(PUBLISH_DEST):$(PUBLISH_DIR)

sass:
	gulp sass
.PHONY: sass
