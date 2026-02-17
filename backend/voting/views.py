from rest_framework.decorators import permission_classes
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer

from .models import Candidate
from .serializers import CandidateSerializer

from rest_framework.permissions import IsAuthenticated
from .models import Vote
from django.shortcuts import get_object_or_404


@api_view(['GET'])
def get_election(request):
    election = Election.objects.first()
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

    # Check if user already voted
    if Vote.objects.filter(user=user).exists():
        return Response({"error": "You have already voted!"}, status=400)

    # Get candidate
    candidate = get_object_or_404(Candidate, id=candidate_id)

    # Increase vote count
    candidate.vote_count += 1
    candidate.save()

    # Create vote record
    Vote.objects.create(user=user, candidate=candidate)

    return Response({"message": "Vote cast successfully!"})