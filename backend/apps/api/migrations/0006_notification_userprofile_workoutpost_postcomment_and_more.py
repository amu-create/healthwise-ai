# Generated by Django 5.2 on 2025-06-18 09:08

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_merge_20250618_1531'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('achievement', '업적'), ('social', '소셜'), ('workout', '운동'), ('nutrition', '영양'), ('system', '시스템')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('title_en', models.CharField(blank=True, max_length=200, null=True)),
                ('title_es', models.CharField(blank=True, max_length=200, null=True)),
                ('message', models.TextField()),
                ('message_en', models.TextField(blank=True, null=True)),
                ('message_es', models.TextField(blank=True, null=True)),
                ('is_read', models.BooleanField(default=False)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('action_url', models.CharField(blank=True, max_length=200, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '알림',
                'verbose_name_plural': '알림 목록',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bio', models.TextField(blank=True, help_text='자기소개', max_length=500)),
                ('profile_picture_url', models.URLField(blank=True, null=True)),
                ('privacy_setting', models.CharField(choices=[('public', '공개'), ('friends', '친구만'), ('private', '비공개')], default='public', max_length=10)),
                ('allow_friend_requests', models.BooleanField(default=True)),
                ('show_achievement_badges', models.BooleanField(default=True)),
                ('show_workout_stats', models.BooleanField(default=True)),
                ('show_nutrition_stats', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='social_profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '소셜 프로필',
                'verbose_name_plural': '소셜 프로필 목록',
            },
        ),
        migrations.CreateModel(
            name='WorkoutPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(help_text='게시물 내용')),
                ('image_url', models.URLField(blank=True, null=True)),
                ('media_file', models.FileField(blank=True, null=True, upload_to='social/posts/%Y/%m/')),
                ('media_type', models.CharField(blank=True, choices=[('image', '이미지'), ('video', '동영상'), ('gif', 'GIF')], max_length=10, null=True)),
                ('media_url', models.URLField(blank=True, help_text='업로드된 미디어 URL', null=True)),
                ('visibility', models.CharField(choices=[('public', '전체 공개'), ('followers', '팔로워만'), ('private', '비공개')], default='public', max_length=10)),
                ('likes_count', models.IntegerField(default=0)),
                ('comments_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_posts', to=settings.AUTH_USER_MODEL)),
                ('workout_log', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.workoutroutinelog')),
            ],
            options={
                'verbose_name': '운동 게시물',
                'verbose_name_plural': '운동 게시물 목록',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PostComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='api.postcomment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='api.workoutpost')),
            ],
            options={
                'verbose_name': '댓글',
                'verbose_name_plural': '댓글 목록',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='Follow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('follower', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='following', to=settings.AUTH_USER_MODEL)),
                ('following', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followers', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '팔로우',
                'verbose_name_plural': '팔로우 목록',
                'unique_together': {('follower', 'following')},
            },
        ),
        migrations.CreateModel(
            name='FriendRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.CharField(blank=True, max_length=200)),
                ('status', models.CharField(choices=[('pending', '대기중'), ('accepted', '수락됨'), ('rejected', '거절됨')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friend_requests_sent', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friend_requests_received', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '친구 요청',
                'verbose_name_plural': '친구 요청 목록',
                'unique_together': {('from_user', 'to_user')},
            },
        ),
        migrations.CreateModel(
            name='PostLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='api.workoutpost')),
            ],
            options={
                'verbose_name': '좋아요',
                'verbose_name_plural': '좋아요 목록',
                'unique_together': {('user', 'post')},
            },
        ),
    ]
