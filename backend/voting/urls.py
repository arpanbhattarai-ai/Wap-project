from django.urls import path
from .views import register_user, get_candidates, vote, get_election

urlpatterns = [
    path('election/', get_election),
    path('register/', register_user),
    path('candidates/', get_candidates),
    path('vote/<int:candidate_id>/', vote),
]