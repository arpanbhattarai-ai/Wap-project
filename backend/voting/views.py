from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Candidate, Election, Vote
from .serializers import CandidateSerializer, ElectionSerializer, RegisterSerializer


def _get_relevant_election():
    """Return the active election if one exists, otherwise the nearest by start time."""
    active_election = Election.objects.filter(is_active=True).order_by('start_time').first()
    if active_election:
        return active_election

    return Election.objects.order_by('start_time').first()


@api_view(['GET'])
def get_election(request):
    election = _get_relevant_election()
    if not election:
        return Response({"detail": "No election configured."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ElectionSerializer(election)
    return Response(serializer.data)


@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created successfully!"})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_candidates(request):
    election_id = request.query_params.get('election_id')

    if election_id:
        candidates = Candidate.objects.filter(election_id=election_id).order_by('name')
    else:
        election = _get_relevant_election()
        if not election:
            return Response([], status=status.HTTP_200_OK)
        candidates = Candidate.objects.filter(election=election).order_by('name')

    serializer = CandidateSerializer(candidates, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote(request, candidate_id):
    user = request.user

    if Vote.objects.filter(user=user).exists():
        return Response({"error": "You have already voted!"}, status=status.HTTP_400_BAD_REQUEST)

    candidate = get_object_or_404(Candidate, id=candidate_id)

    election = candidate.election
    if not election:
        return Response({"error": "This candidate is not assigned to an election."}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    if not election.is_active:
        return Response({"error": "Voting is not active for this election."}, status=status.HTTP_400_BAD_REQUEST)

    if now < election.start_time:
        return Response({"error": "Voting has not started yet."}, status=status.HTTP_400_BAD_REQUEST)

    if now >= election.end_time:
        return Response({"error": "Voting for this election has ended."}, status=status.HTTP_400_BAD_REQUEST)

    candidate.vote_count += 1
    candidate.save(update_fields=['vote_count'])

    Vote.objects.create(user=user, candidate=candidate)

    return Response({"message": "Vote cast successfully!"})
