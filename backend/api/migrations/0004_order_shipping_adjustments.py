from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_order_pod_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='additional_shipping_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_slot',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='initial_delivery_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='logistics_plan',
            field=models.CharField(blank=True, max_length=40, null=True),
        ),
    ]
