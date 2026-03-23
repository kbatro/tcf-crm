export const englishCrmMessages = {
  resources: {
    companies: {
      name: "Group |||| Groups",
      forcedCaseName: "Group",
      fields: {
        name: "Group name",
        website: "Website",
        linkedin_url: "LinkedIn URL",
        phone_number: "Phone number",
        created_at: "Created at",
        nb_contacts: "Number of members",
        revenue: "Revenue",
        sector: "Sector",
        size: "Size",
        tax_identifier: "Tax Identifier",
        address: "Address",
        city: "City",
        zipcode: "Zip code",
        state_abbr: "State",
        country: "Country",
        description: "Description",
        context_links: "Context links",
        actor_id: "Assigned to",
      },
      empty: {
        description: "It seems your group list is empty.",
        title: "No groups found",
      },
      field_categories: {
        contact: "Contact",
        additional_info: "Additional information",
        address: "Address",
        context: "Context",
      },
      action: {
        create: "Create Group",
        edit: "Edit group",
        new: "New Group",
        show: "Show group",
      },
      added_on: "Added on %{date}",
      followed_by: "Followed by %{name}",
      followed_by_you: "Followed by you",
      no_members: "No members",
      nb_members: "%{smart_count} member |||| %{smart_count} members",
      nb_intentions: "%{smart_count} effort |||| %{smart_count} efforts",
      sizes: {
        one_employee: "1 employee",
        two_to_nine_employees: "2-9 employees",
        ten_to_forty_nine_employees: "10-49 employees",
        fifty_to_two_hundred_forty_nine_employees: "50-249 employees",
        two_hundred_fifty_or_more_employees: "250 or more employees",
      },
      autocomplete: {
        create_error: "An error occurred while creating the group",
        create_item: "Create %{item}",
        create_label: "Start typing to create a new group",
      },
      filters: {
        only_mine: "Only groups I manage",
      },
    },
    contacts: {
      name: "Person |||| People",
      forcedCaseName: "Person",
      field_categories: {
        background_info: "Background info",
        identity: "Identity",
        misc: "Misc",
        personal_info: "Personal info",
        position: "Position",
      },
      fields: {
        first_name: "First name",
        last_name: "Last name",
        last_seen: "Last seen",
        title: "Title",
        company_id: "Group",
        email_jsonb: "Email addresses",
        email: "Email",
        phone_jsonb: "Phone numbers",
        phone_number: "Phone number",
        linkedin_url: "LinkedIn URL",
        background: "Background info (bio, how you met, etc)",
        has_newsletter: "Has newsletter",
        actor_id: "Assigned to",
      },
      action: {
        add: "Add person",
        add_first: "Add your first person",
        create: "Add person",
        edit: "Edit person",
        export_vcard: "Export to vCard",
        new: "New person",
        show: "Show person",
      },
      background: {
        last_activity_on: "Last activity on %{date}",
        added_on: "Added on %{date}",
        followed_by: "Followed by %{name}",
        followed_by_you: "Followed by you",
      },
      position_at: "%{title} at",
      position_at_company: "%{title} at %{company}",
      empty: {
        description: "It seems your people list is empty.",
        title: "No people found",
      },
      import: {
        title: "Import people",
        button: "Import CSV",
        complete:
          "People import complete. Imported %{importCount} people, with %{errorCount} errors",
        progress:
          "Imported %{importCount} / %{rowCount} people, with %{errorCount} errors.",
        error:
          "Failed to import this file, please make sure your provided a valid CSV file.",
        imported: "Imported",
        remaining_time: "Estimated remaining time:",
        running: "The import is running, please do not close this tab.",
        sample_download: "Download CSV sample",
        sample_hint: "Here is a sample CSV file you can use as a template",
        stop: "Stop import",
        csv_file: "CSV File",
        contacts_label: "person |||| people",
      },
      inputs: {
        genders: {
          male: "He/Him",
          female: "She/Her",
          nonbinary: "They/Them",
        },
        personal_info_types: {
          work: "Work",
          home: "Home",
          other: "Other",
        },
      },
      list: {
        error_loading: "Error loading people",
      },
      merge: {
        action: "Merge with another person",
        confirm: "Merge People",
        current_contact: "Current Person (will be deleted)",
        description: "Merge this person with another one.",
        error: "Failed to merge people",
        merging: "Merging...",
        no_additional_data: "No additional data to merge",
        select_target: "Please select a person to merge with",
        success: "People merged successfully",
        target_contact: "Target Person (will be kept)",
        title: "Merge Person",
        warning_description:
          "All data will be transferred to the second person. This action cannot be undone.",
        warning_title: "Warning: Destructive Operation",
        what_will_be_merged: "What will be merged:",
      },
      filters: {
        before_last_month: "Before last month",
        before_this_month: "Before this month",
        before_this_week: "Before this week",
        managed_by_me: "Managed by me",
        search: "Search name, group...",
        this_week: "This week",
        today: "Today",
        tags: "Tags",
        tasks: "Tasks",
      },
      recent: {
        empty: "No recent people yet.",
        title: "Recent People",
      },
    },
    intentions: {
      name: "Effort |||| Efforts",
      forcedCaseName: "Effort",
      fields: {
        name: "Name",
        description: "Description",
        type: "Type",
        status: "Status",
      },
      action: {
        back_to_intention: "Back to effort",
        create: "Create effort",
        new: "New Effort",
      },
      field_categories: {
        misc: "Misc",
      },
      archived: {
        action: "Archive",
        error: "Error: effort not archived",
        list_title: "Archived Efforts",
        success: "Effort archived",
        title: "Archived Effort",
        view: "View archived efforts",
      },
      unarchived: {
        action: "Send back to the board",
        error: "Error: effort not unarchived",
        success: "Effort unarchived",
      },
      updated: "Effort updated",
      empty: {
        before_create: "before creating an effort.",
        description: "It seems your effort list is empty.",
        title: "No efforts found",
      },
    },
    notes: {
      name: "Note |||| Notes",
      forcedCaseName: "Note",
      fields: {
        status: "Status",
        date: "Date",
        attachments: "Attachments",
        contact_id: "Person",
        intention_id: "Effort",
      },
      action: {
        add: "Add note",
        add_first: "Add your first note",
        delete: "Delete note",
        edit: "Edit note",
        update: "Update note",
        add_this: "Add this note",
      },
      sheet: {
        create: "Create note",
        create_for: "Create note for %{name}",
        edit: "Edit note",
        edit_for: "Edit note for %{name}",
      },
      deleted: "Note deleted",
      empty: "No notes yet",
      author_added: "%{name} added a note",
      you_added: "You added a note",
      me: "Me",
      list: {
        error_loading: "Error loading notes",
      },
      note_for_contact: "Note for %{name}",
      stepper: {
        hint: "Go to a person page and add a note",
      },
      added: "Note added",
      inputs: {
        add_note: "Add a note",
        options_hint: "(attach files, or change details)",
        show_options: "Show options",
      },
    },
    actors: {
      name: "User |||| Users",
      fields: {
        first_name: "First name",
        last_name: "Last name",
        email: "Email",
        administrator: "Admin",
        disabled: "Disabled",
      },
      create: {
        error: "An error occurred while creating the user.",
        success:
          "User created. They will soon receive an email to set their password.",
        title: "Create a new user",
      },
      edit: {
        error: "An error occurred. Please try again.",
        record_not_found: "Record not found",
        success: "User updated successfully",
        title: "Edit %{name}",
      },
      action: {
        new: "New user",
      },
    },
    tasks: {
      name: "Task |||| Tasks",
      forcedCaseName: "Task",
      fields: {
        text: "Description",
        due_date: "Due date",
        type: "Type",
        contact_id: "Person",
        due_short: "due",
      },
      action: {
        add: "Add task",
        create: "Create task",
        edit: "Edit task",
      },
      actions: {
        postpone_next_week: "Postpone to next week",
        postpone_tomorrow: "Postpone to tomorrow",
        title: "task actions",
      },
      added: "Task added",
      deleted: "Task deleted successfully",
      dialog: {
        create: "Create task",
        create_for: "Create task for %{name}",
      },
      sheet: {
        edit: "Edit task",
        edit_for: "Edit task for %{name}",
      },
      empty: "No tasks yet",
      empty_list_hint: "Tasks added to your people will appear here.",
      filters: {
        later: "Later",
        overdue: "Overdue",
        this_week: "This week",
        today: "Today",
        tomorrow: "Tomorrow",
        with_pending: "With pending tasks",
      },
      regarding_contact: "(Re: %{name})",
      updated: "Task updated",
    },
    tags: {
      name: "Tag |||| Tags",
      action: {
        add: "Add tag",
        create: "Create new tag",
      },
      dialog: {
        color: "Color",
        create_title: "Create a new tag",
        edit_title: "Edit tag",
        name_label: "Tag name",
        name_placeholder: "Enter tag name",
      },
    },
  },
  crm: {
    action: {
      reset_password: "Reset Password",
    },
    auth: {
      first_name: "First name",
      last_name: "Last name",
      confirm_password: "Confirm password",
      confirmation_required:
        "Please follow the link we just sent you by email to confirm your account.",
      recovery_email_sent:
        "If you're a registered user, you should receive a password recovery email shortly.",
      sign_in_failed: "Failed to log in.",
      sign_in_google_workspace: "Sign in with Google Workplace",
      signup: {
        create_account: "Create account",
        create_first_user:
          "Create the first user account to complete the setup.",
        creating: "Creating...",
        initial_user_created: "Initial user successfully created",
      },
      welcome_title: "Welcome to TCF CRM",
    },
    common: {
      activity: "Activity",
      added: "added",
      details: "Details",
      last_activity_with_date: "last activity %{date}",
      load_more: "Load more",
      misc: "Misc",
      past: "Past",
      read_more: "Read more",
      retry: "Retry",
      show_less: "Show less",
      copied: "Copied!",
      copy: "Copy",
      loading: "Loading...",
      me: "Me",
      task_count: "%{smart_count} task |||| %{smart_count} tasks",
    },
    activity: {
      added_company: "%{name} added group",
      you_added_company: "You added group",
      added_contact: "%{name} added",
      you_added_contact: "You added",

      added_note: "%{name} added a note about",
      you_added_note: "You added a note about",
      added_note_about_intention: "%{name} added a note about effort",
      you_added_note_about_intention: "You added a note about effort",
      added_intention: "%{name} added effort",
      you_added_intention: "You added effort",
      at_company: "at",
      to: "to",
      load_more: "Load more activity",
    },
    dashboard: {
      intentions_chart: "Efforts by Status",
      intentions_pipeline: "Efforts Pipeline",
      latest_activity: "Latest Activity",
      latest_activity_error: "Error loading latest activity",
      latest_notes: "My Latest Notes",
      latest_notes_added_ago: "added %{timeAgo}",
      stepper: {
        install: "Install TCF CRM",
        progress: "%{step}/3 done",
        whats_next: "What's next?",
      },
      upcoming_tasks: "Upcoming Tasks",
    },
    header: {
      import_data: "Import data",
    },
    image_editor: {
      change: "Change",
      drop_hint: "Drop a file to upload, or click to select it.",
      editable_content: "Editable content",
      title: "Upload and resize image",
      update_image: "Update Image",
    },
    import: {
      action: {
        download_error_report: "Download the error report",
        import: "Import",
        import_another: "Import another file",
      },
      error: {
        unable: "Unable to import this file.",
      },
      idle: {
        description_1:
          "You can import sales, groups, people, notes, and tasks.",
        description_2:
          "Data must be in a JSON file matching the following sample:",
      },
      status: {
        all_success: "All records were imported successfully.",
        complete: "Import complete.",
        failed: "Failed",
        imported: "Imported",
        in_progress:
          "Import in progress, please don't navigate away from this page.",
        some_failed: "Some records were not imported.",
        table_caption: "Import status",
      },
      title: "Import Data",
    },
    settings: {
      companies: {
        sectors: "Sectors",
      },
      dark_mode_logo: "Dark Mode Logo",
      intentions: {
        types: "Types",
        currency: "Currency",
        success_help:
          "Select which effort statuses should count as success.",
        success_statuses: "Success Statuses",
        statuses: "Statuses",
      },
      light_mode_logo: "Light Mode Logo",
      notes: {
        statuses: "Statuses",
      },
      reset_defaults: "Reset to Defaults",
      save_error: "Failed to save configuration",
      saved: "Configuration saved successfully",
      saving: "Saving...",
      tasks: {
        types: "Types",
      },
      preferences: "Preferences",
      title: "Settings",
      app_title: "App Title",
      sections: {
        branding: "Branding",
      },
      validation: {
        duplicate: "Duplicate %{display_name}: %{items}",
        in_use:
          "Cannot remove %{display_name} that are still used by efforts: %{items}",
        validating: "Validating\u2026",
        entities: {
          types: "types",
          statuses: "statuses",
        },
      },
    },
    theme: {
      dark: "Dark",
      label: "Theme",
      light: "Light",
      system: "System",
    },
    language: "Language",
    navigation: {
      label: "CRM navigation",
    },
    profile: {
      inbound: {
        description:
          "You can start sending emails to your server's inbound email address, e.g. by adding it to the %{field} field. TCF CRM will process the emails and add notes to the corresponding people.",
        title: "Inbound email",
      },
      password: {
        change: "Change password",
      },
      password_reset_sent:
        "A reset password email has been sent to your email address",
      record_not_found: "Record not found",
      title: "Profile",
      updated: "Your profile has been updated",
      update_error: "An error occurred. Please try again",
    },
    validation: {
      invalid_url: "Must be a valid URL",
      invalid_linkedin_url: "URL must be from linkedin.com",
    },
  },
} as const;

type MessageSchema<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? MessageSchema<T[K]>
      : never;
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

export type CrmMessages = MessageSchema<typeof englishCrmMessages>;
export type PartialCrmMessages = DeepPartial<CrmMessages>;
