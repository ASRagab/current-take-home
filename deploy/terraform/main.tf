provider "google" {
  project = var.project
}

data "google_project" "project" {
  project_id = var.project
}

locals {
  dbUser = var.service
}

resource "google_cloud_run_service" "current" {
  project  = var.project
  name     = var.service
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "10"
        "run.googleapis.com/client-name"        = "terraform"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.primary.connection_name
      }
    }

    spec {
      containers {
        image = var.digest

        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }

        env {
          name  = "DB_INSTANCE"
          value = "/cloudsql/${google_sql_database_instance.primary.connection_name}"
        }

        env {
          name  = "DB_NAME"
          value = google_sql_database.database.name
        }

        env {
          name  = "DB_USER"
          value = google_sql_user.users.name
        }

        env {
          name  = "DB_PASSWORD"
          value = google_sql_user.users.password
        }

        env {
          name  = "MAPS_API_KEY"
          value = var.maps_api_key
        }
      }
    }
  }
}

data "google_iam_policy" "iam_policy" {
  binding {
    role = "roles/run.invoker"
    members = [
    "allUsers"]
  }
}

resource "google_cloud_run_service_iam_policy" "cloud_run_service_policy" {
  location = google_cloud_run_service.current.location
  project  = google_cloud_run_service.current.project
  service  = google_cloud_run_service.current.name

  policy_data = data.google_iam_policy.iam_policy.policy_data
}

resource "google_sql_database_instance" "primary" {
  project          = var.project
  name             = "${var.service}-primary"
  database_version = var.database
  region           = var.region

  settings {
    tier = var.tier
  }
}

resource "google_sql_database" "database" {
  instance = google_sql_database_instance.primary.name
  project  = var.project
  name     = var.service

  depends_on = [
    google_sql_database_instance.primary
  ]
}


resource "google_sql_user" "users" {
  project  = var.project
  name     = local.dbUser
  instance = google_sql_database_instance.primary.name
  password = var.password

  depends_on = [
    google_sql_database_instance.primary
  ]
}

resource "google_project_iam_member" "cloud_sql_membership" {
  project = var.project
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  role    = "roles/cloudsql.client"
}