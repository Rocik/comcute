FROM jekyll/jekyll as builder

ENV JEKYLL_ENV=production

WORKDIR /srv/jekyll

COPY Gemfile ./
COPY Gemfile.lock ./
RUN bundle install

COPY . ./
RUN jekyll build


FROM nginx

ADD nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /srv/jekyll/_site /usr/share/nginx/html