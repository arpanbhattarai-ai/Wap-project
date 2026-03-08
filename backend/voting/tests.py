from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Candidate, Election


class VotingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_election_returns_404_when_missing(self):
        response = self.client.get('/api/election/')

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['detail'], 'No election configured.')

    def test_get_election_returns_data_when_exists(self):
        election = Election.objects.create(
            title='Student Council 2026',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2),
            is_active=True,
        )

        response = self.client.get('/api/election/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], election.id)
        self.assertEqual(response.data['title'], 'Student Council 2026')

    def test_get_election_prefers_ongoing_over_old_ended(self):
        now = timezone.now()
        Election.objects.create(
            title='Old Election',
            start_time=now - timedelta(days=4),
            end_time=now - timedelta(days=3),
            is_active=True,
        )
        ongoing = Election.objects.create(
            title='Current Election',
            start_time=now - timedelta(minutes=10),
            end_time=now + timedelta(minutes=50),
            is_active=True,
        )

        response = self.client.get('/api/election/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], ongoing.id)

    def test_get_candidates_defaults_to_relevant_election(self):
        now = timezone.now()
        old_election = Election.objects.create(
            title='Old Election',
            start_time=now - timedelta(days=3),
            end_time=now - timedelta(days=2),
            is_active=True,
        )
        current_election = Election.objects.create(
            title='Current Election',
            start_time=now - timedelta(minutes=5),
            end_time=now + timedelta(hours=2),
            is_active=True,
        )
        Candidate.objects.create(election=old_election, name='Old A', description='Old')
        current_candidate = Candidate.objects.create(
            election=current_election,
            name='Current A',
            description='Current',
        )

        response = self.client.get('/api/candidates/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], current_candidate.id)

    def test_vote_requires_authentication(self):
        election = Election.objects.create(
            title='Student Council',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            is_active=True,
        )
        candidate = Candidate.objects.create(
            election=election,
            name='Candidate A',
            description='Manifesto',
        )

        response = self.client.post(f'/api/vote/{candidate.id}/', {}, format='json')

        self.assertEqual(response.status_code, 401)

    def test_vote_rejected_when_election_not_started(self):
        user = User.objects.create_user(username='bob', password='password123')
        election = Election.objects.create(
            title='Future Election',
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            is_active=True,
        )
        candidate = Candidate.objects.create(
            election=election,
            name='Candidate A',
            description='Manifesto',
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(f'/api/vote/{candidate.id}/', {}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Election has not started yet.')

    def test_vote_rejected_when_election_ended(self):
        user = User.objects.create_user(username='carol', password='password123')
        election = Election.objects.create(
            title='Ended Election',
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() - timedelta(hours=1),
            is_active=True,
        )
        candidate = Candidate.objects.create(
            election=election,
            name='Candidate A',
            description='Manifesto',
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(f'/api/vote/{candidate.id}/', {}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Election has already ended.')

    def test_user_can_only_vote_once(self):
        user = User.objects.create_user(username='alice', password='password123')
        election = Election.objects.create(
            title='Student Council',
            start_time=timezone.now() - timedelta(minutes=5),
            end_time=timezone.now() + timedelta(hours=1),
            is_active=True,
        )
        candidate_1 = Candidate.objects.create(
            election=election,
            name='Candidate A',
            description='Manifesto A',
        )
        candidate_2 = Candidate.objects.create(
            election=election,
            name='Candidate B',
            description='Manifesto B',
        )

        self.client.force_authenticate(user=user)

        first_vote = self.client.post(f'/api/vote/{candidate_1.id}/', {}, format='json')
        second_vote = self.client.post(f'/api/vote/{candidate_2.id}/', {}, format='json')

        candidate_1.refresh_from_db()
        candidate_2.refresh_from_db()

        self.assertEqual(first_vote.status_code, 200)
        self.assertEqual(second_vote.status_code, 400)
        self.assertEqual(candidate_1.vote_count, 1)
        self.assertEqual(candidate_2.vote_count, 0)
