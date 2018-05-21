module Jekyll
  class Translatel18n < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)
      site = context.registers[:site]
      lang = site.active_lang
      site.data['i18n'][@text.strip!][lang]
    end
  end
end

Liquid::Template.register_tag('tl', Jekyll::Translatel18n)
