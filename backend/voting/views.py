from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Candidate, Election, Vote
from .serializers import CandidateSerializer, ElectionSerializer, RegisterSerializer


@api_view(['GET'])
def get_election(request):
    election = Election.objects.first()
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
    candidates = Candidate.objects.all()
    serializer = CandidateSerializer(candidates, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote(request, candidate_id):
    user = request.user

    if Vote.objects.filter(user=user).exists():
        return Response({"error": "You have already voted!"}, status=status.HTTP_400_BAD_REQUEST)

    candidate = get_object_or_404(Candidate, id=candidate_id)

    candidate.vote_count += 1
    candidate.save(update_fields=['vote_count'])

    Vote.objects.create(user=user, candidate=candidate)

    return Response({"message": "Vote cast successfully!"})
