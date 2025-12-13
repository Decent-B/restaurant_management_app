# Generated migration to copy data from Staff and Diner to User
from django.db import migrations


def migrate_staff_and_diner_to_user(apps, schema_editor):
    """Copy all Staff and Diner records to the new User model."""
    # Get the old models
    Staff = apps.get_model('accounts', 'Staff')
    Diner = apps.get_model('accounts', 'Diner')
    User = apps.get_model('accounts', 'User')
    
    # Migrate all Staff to User
    staff_members = Staff.objects.all()
    for staff in staff_members:
        User.objects.create(
            id=staff.id,
            name=staff.name,
            email=staff.email,
            hashed_password=staff.hashed_password,
            phone_num='',  # Staff didn't have phone_num in old model
            role=staff.role.upper(),  # Convert to uppercase to match CHOICES
            time_created=staff.time_created,
        )
    
    # Migrate all Diner to User
    diners = Diner.objects.all()
    for diner in diners:
        User.objects.create(
            id=diner.id,
            name=diner.name,
            email=diner.email,
            hashed_password=diner.hashed_password,
            phone_num=diner.phone_num,
            role='DINER',
            time_created=diner.time_created,
        )


def reverse_migration(apps, schema_editor):
    """Delete all User records (reverse operation)."""
    User = apps.get_model('accounts', 'User')
    User.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user'),
    ]

    operations = [
        migrations.RunPython(migrate_staff_and_diner_to_user, reverse_migration),
    ]
