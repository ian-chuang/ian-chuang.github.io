<h2 id="publications" style="margin: 2px 0px -15px;">Projects</h2>

<div class="publications">
<ol class="bibliography">

{% for link in site.data.projects.main %}

<li>
<div class="pub-row">
  {% if link.image %} 
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
  </div>
  {% endif %}
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
      <div class="title"><a href="{{ link.code }}">{{ link.title }}</a></div>
      <div class="author">{{ link.description }}</div>
    <div class="links">
      {% if link.code %} 
      <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Code</a>
      {% endif %}
    </div>
  </div>
</div>
</li>

<br>

{% endfor %}

<!-- <p style="font-size: 1.1rem;">Check out more projects <a href="https://github.com/ian-chuang">here</a>!</p> -->

</ol>
</div>