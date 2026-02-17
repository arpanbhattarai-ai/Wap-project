from django.contrib import admin
from .models import Candidate, Vote, Election

admin.site.register(Election)
admin.site.register(Candidate)
admin.site.register(Vote)