from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Candidate, Election, Vote
from .serializers import CandidateSerializer, ElectionSerializer, RegisterSerializer


def _get_relevant_election():
    """Pick the most relevant election for the current moment.

    Priority:
    1) Ongoing active election
    2) Next upcoming active election
    3) Most recently finished election
    4) Any most recently created election fallback
    """
    now = timezone.now()

    ongoing = Election.objects.filter(
        is_active=True,
        start_time__lte=now,
        end_time__gt=now,
    ).order_by('start_time').first()
    if ongoing:
        return ongoing

    upcoming = Election.objects.filter(
        is_active=True,
        start_time__gt=now,
    ).order_by('start_time').first()
    if upcoming:
        return upcoming

    finished = Election.objects.filter(end_time__lte=now).order_by('-end_time', '-id').first()
    if finished:
        return finished

    return Election.objects.order_by('-id').first()


def _build_election_state(election):
    now = timezone.now()

    if not election.is_active:
        return {
            'status': 'paused',
            'can_vote': False,
            'status_message': 'Voting is currently paused.',
            'server_time': now.isoformat(),
        }

    if now < election.start_time:
        return {
            'status': 'upcoming',
            'can_vote': False,
            'status_message': 'Voting has not started yet.',
            'server_time': now.isoformat(),
        }

    if now >= election.end_time:
        return {
            'status': 'ended',
            'can_vote': False,
            'status_message': 'Voting has ended for this election.',
            'server_time': now.isoformat(),
        }

    return {
        'status': 'ongoing',
        'can_vote': True,
        'status_message': '',
        'server_time': now.isoformat(),
    }


@api_view(['GET'])
def get_election(request):
    election = _get_relevant_election()
    if not election:
        return Response({"detail": "No election configured."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ElectionSerializer(election)
    response_data = serializer.data
    response_data.update(_build_election_state(election))
    return Response(response_data)


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

    election_state = _build_election_state(election)
    if not election_state['can_vote']:
        return Response({"error": election_state['status_message']}, status=status.HTTP_400_BAD_REQUEST)

    candidate.vote_count += 1
    candidate.save(update_fields=['vote_count'])

    Vote.objects.create(user=user, candidate=candidate)

    return Response({"message": "Vote cast successfully!"})
