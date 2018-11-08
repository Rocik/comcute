FROM jekyll/jekyll

COPY Gemfile .

RUN bundle install

COPY . /srv/jekyll